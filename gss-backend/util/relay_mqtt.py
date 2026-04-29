from flask_mqtt import Mqtt
from flask_socketio import SocketIO, emit
import json
import os
import time

DS_PATH = '/app/config/data_source.json'
DS_DEFAULT = {'host': 'localhost', 'port': 1884}

# Module-level state used by the WS handlers. Set by main.py at startup and
# by the on_connect / on_disconnect MQTT callbacks during runtime.
DS_DEGRADED = False        # True if effective != configured (fallback active)
MQTT_CONNECTED = False     # Live: is the paho client currently connected?
CONFIGURED_HOST = 'localhost'
CONFIGURED_PORT = 1884
EFFECTIVE_HOST = 'mqtt'    # After resolve_broker() aliasing and fallback
EFFECTIVE_PORT = 1884

# Wildcard MQTT topics. Telemetry streams are per-flight-computer (SN), so we
# subscribe to a wildcard and parse the SN out of the topic at message time
# rather than enumerating channels in config.
FLIGHT_DATA_WILDCARD = 'FlightData/+'
CONTROL_WILDCARD = 'Control/+'
COMMON_WILDCARD = 'Common/#'

GSS_GLOBALS = {}

# Last-seen serial_info envelope per source_id. Replayed to socket.io clients on
# connect so the frontend's MIDAS roster survives a page reload (the broker
# delivers retained payloads to *us* on subscribe, but socket.io clients that
# join after that never see them).
SERIAL_INFO_CACHE = {}

def update_gss_globals(incoming):
    global GSS_GLOBALS

    for key in incoming:
        GSS_GLOBALS[key] = incoming[key]


class RelayMqtt:
    def __init__(self, app):
        mqtt = Mqtt(app)
        socketio = SocketIO(app, cors_allowed_origins="*")
        self.__gss_globals = {}


        @socketio.on("connect")
        def handle_socket_connect():
            # Replay the cached serial_info envelopes to the just-connected client.
            # Without this, a page reload empties the MIDAS roster until the next
            # standalone heartbeat lands.
            count = 0
            for src, envelope in SERIAL_INFO_CACHE.items():
                emit('mqtt_message', json.dumps(envelope))
                count += 1
            if count:
                print(f"[serial_info] replayed {count} cached envelopes to new client", flush=True)

        @socketio.on("sync")
        def handle_sync_ws(sync_type):
            # Handles any client sync packets
            # sync_type defines which packet to return.
            # sync_globals --> sync the @GSS data stored here
            if sync_type == "sync_globals":
                payload = {"type": "globals", "data": GSS_GLOBALS}

                emit("sync_response", json.dumps(payload))

        @socketio.on("get_datasource")
        def handle_get_datasource(_=None):
            emit("datasource_state", json.dumps({
                "host": CONFIGURED_HOST,
                "port": CONFIGURED_PORT,
                "effective_host": EFFECTIVE_HOST,
                "effective_port": EFFECTIVE_PORT,
                "degraded": DS_DEGRADED,
                "connected": MQTT_CONNECTED,
            }))

        @socketio.on("update_datasource")
        def handle_update_datasource(payload):
            # Writes the new data source to the mounted config volume, notifies the
            # client, and exits so docker-compose's restart policy brings the backend
            # back up with the new MQTT broker wired in. Hot-reconfiguring flask-mqtt
            # is fragile; a clean restart is ~2s and deterministic.
            try:
                data = json.loads(payload)
                ds = dict(DS_DEFAULT)
                if 'host' in data: ds['host'] = str(data['host'])
                if 'port' in data: ds['port'] = int(data['port'])
                os.makedirs(os.path.dirname(DS_PATH), exist_ok=True)
                with open(DS_PATH, 'w') as f:
                    json.dump(ds, f)
                emit("datasource_updated", json.dumps({"status": "restarting", "applied": ds}))
                print(f"Datasource updated to {ds}; exiting for restart.", flush=True)
                # Give socketio a moment to flush the ack to the client before we die.
                socketio.sleep(0.5)
                os._exit(0)
            except (json.JSONDecodeError, KeyError, ValueError, OSError) as e:
                print(f"update_datasource failed: {e}", flush=True)
                emit("datasource_updated", json.dumps({"status": "error", "error": str(e)}))

        @socketio.on("gss")
        def handle_gss_comm(data):
            try:
                data_json = json.loads(data)

                if data_json["source"] == "gss-frontend":
                    print("Decoded msg from frontend", flush=True)

                    if data_json["type"] == "mqtt-autosend-cmd" or data_json["type"] == "mqtt-autosend-raw":
                        # Relay but don't wrap in metadata
                        channel = data_json["stream"]
                        mqtt.publish(channel, data_json['data'])

                        if data_json["type"] == "mqtt-autosend-cmd":
                            socketio.start_background_task(target=cmd_stat_msg, message=1)
                        return

                    if data_json["type"] == "mqtt-autosend":
                        # Immediately relay the msg through mqtt
                        # Get channel
                        channel = data_json["stream"]

                        # Package a proper mqtt msg
                        msg_payload = {"metadata": {
                            "stream": "gss_global",
                            "time_republished": time.time(),
                            "type": "gss_msg"
                        }, "data": json.loads(data_json['data'])}

                        mqtt.publish(channel, json.dumps(msg_payload))
            except json.JSONDecodeError:
                print("Unable to decode GSS transmission: ", data, flush=True)
                socketio.start_background_task(target=emit_err_msg, message={"error": "Unable to decode JSON", "req": data})
                

        def emit_mqtt_status():
            socketio.emit("mqtt_status", json.dumps({
                "connected": MQTT_CONNECTED,
                "configured_host": CONFIGURED_HOST,
                "configured_port": CONFIGURED_PORT,
                "effective_host": EFFECTIVE_HOST,
                "effective_port": EFFECTIVE_PORT,
                "degraded": DS_DEGRADED,
            }))

        @mqtt.on_connect()
        def handle_connect(client, userdata, flags, rc):
            global MQTT_CONNECTED
            broker = f"{app.config['MQTT_BROKER_URL']}:{app.config['MQTT_BROKER_PORT']}"
            if rc == 0:
                MQTT_CONNECTED = True
                print(f"Connected to MQTT broker at {broker} (degraded={DS_DEGRADED}), subscribing...", flush=True)

                mqtt.subscribe(FLIGHT_DATA_WILDCARD)
                mqtt.subscribe(CONTROL_WILDCARD)
                mqtt.subscribe(COMMON_WILDCARD)
                print(f"Subscribed to {FLIGHT_DATA_WILDCARD}, {CONTROL_WILDCARD}, {COMMON_WILDCARD}", flush=True)

            else:
                MQTT_CONNECTED = False
                print(f"Failed to connect to MQTT broker at {broker}, return code {rc}", flush=True)

            socketio.start_background_task(target=emit_mqtt_status)

        @mqtt.on_disconnect()
        def handle_disconnect(client, userdata, rc):
            global MQTT_CONNECTED
            MQTT_CONNECTED = False
            print(f"MQTT disconnected, rc={rc}", flush=True)
            socketio.start_background_task(target=emit_mqtt_status)

        def emit_err_msg(message):
            socketio.emit('mqtt_message', json.dumps(message))

        def emit_mqtt_msg(message):
            socketio.emit('mqtt_message', json.dumps(message))

        def cmd_stat_msg(message):
            socketio.emit('cmd_stat', message)

        @mqtt.on_message()
        def handle_mqtt_message(client, userdata, message):
            # DEBUG: log every received message so we can see if Common/serial_info/+ is arriving at all.
            try:
                _payload_preview = message.payload.decode()[:200]
            except Exception:
                _payload_preview = "<binary>"
            print(f"[MQTT RX] topic={message.topic} payload={_payload_preview}", flush=True)

            # Empty retained payload on Common/serial_info/<source> → the standalone
            # has gone away. This is the standalone's LWT firing (or a graceful
            # shutdown sending the same tombstone). Empty payload + retain=true also
            # clears the broker's retained record so a fresh subscribe won't see it.
            if message.topic.startswith("Common/serial_info/") and len(message.payload) == 0:
                source_id = message.topic[len("Common/serial_info/"):]
                if source_id in SERIAL_INFO_CACHE:
                    del SERIAL_INFO_CACHE[source_id]
                envelope = {
                    "metadata": {
                        "type": "serial_info_remove",
                        "time_republished": time.time(),
                    },
                    "source_id": source_id,
                }
                print(f"[serial_info] eviction source_id={source_id}", flush=True)
                socketio.start_background_task(target=emit_mqtt_msg, message=envelope)
                return

            # parse packet
            try:
                msg_payload = json.loads(message.payload)
            except json.JSONDecodeError as e:
                print(f"[MQTT RX] JSON decode failed for topic={message.topic}: {e}", flush=True)
                return

            if("type" in msg_payload):
                # Ack / cmd status packets
                if(msg_payload["type"] == "bad_command"):
                    print("Emitting packet (ack/bad)")
                    socketio.start_background_task(target=cmd_stat_msg, message=99)
                    return

                if(msg_payload["type"] == "acknowledge_combiner"):
                    print("Emitting packet (cmb ack)")
                    socketio.start_background_task(target=cmd_stat_msg, message=2)
                    return

                if(msg_payload["type"] == "command_sent"):
                    print("Emitting packet (ack/sent)")
                    socketio.start_background_task(target=cmd_stat_msg, message=3)
                    return

                if(msg_payload["type"] == "command_acknowledge"):
                    print("Emitting packet (ack/good)")
                    socketio.start_background_task(target=cmd_stat_msg, message=4)
                    return

                # FC roster announcement from a standalone (Common/serial_info/+).
                # Pass through with a metadata envelope so the frontend handler can
                # route on metadata.type like other packet kinds. Cache the latest
                # envelope per source_id so a freshly-connecting client gets the
                # current roster without waiting for the next standalone heartbeat.
                if(msg_payload["type"] == "serial_info"):
                    msg_payload["metadata"] = {
                        "type": "serial_info",
                        "time_republished": time.time(),
                    }
                    src = msg_payload.get('source_id')
                    if src is not None:
                        SERIAL_INFO_CACHE[src] = msg_payload
                    print(f"[serial_info] forwarding source_id={src} serials={msg_payload.get('serials')} time_published={msg_payload.get('time_published')}", flush=True)
                    socketio.start_background_task(target=emit_mqtt_msg, message=msg_payload)
                    return
                

            if("source" in msg_payload):
                if(msg_payload["source"] == "gss_combiner"):
                    # This is a gss combiner health packet, append metadata and republish
                    msg_payload["metadata"] = {
                        "stream": "gss_combiner",
                        "time_republished": time.time(),
                        "type": "gss_health"
                    }
                    print("Emitting packet (health)", flush=True)
                    socketio.start_background_task(target=emit_mqtt_msg, message=msg_payload)
                    return
                
            if("metadata" in msg_payload):
                if("type" in msg_payload["metadata"]):
                    if(msg_payload["metadata"]["type"] == "gss_msg"):
                        print("Emitting packet (gss auto-emit)", flush=True)
                        update_gss_globals(msg_payload["data"])
                        socketio.start_background_task(target=emit_mqtt_msg, message=msg_payload)
                        return

            if("data" not in msg_payload):
                print("Error, no 'data' attribute in payload", flush=True)
                return
            

            if("type" not in msg_payload["data"]):
                print("Error, no 'type' attribute in payload data", flush=True)
                return

            if(msg_payload["data"]["type"] == "data"):
                # Telemetry packet. Topic format: FlightData/<serial>; the bare SN
                # becomes the stream identity.
                topic = message.topic
                if "/" in topic:
                    msg_payload["metadata"]["stream"] = topic.split("/", 1)[1]
                else:
                    msg_payload["metadata"]["stream"] = topic

                msg_payload["metadata"]["time_republished"] = time.time()
                msg_payload["metadata"]["type"] = "telemetry"

                print(f"Emitting packet (telem)", flush=True)
                socketio.start_background_task(target=emit_mqtt_msg, message=msg_payload)
                return

            # Fell off every branch — log so we can see what's getting dropped.
            print(f"[MQTT RX] UNHANDLED topic={message.topic} keys={list(msg_payload.keys())} type={msg_payload.get('type')!r}", flush=True)

        mqtt.init_app(app)

        self._MQTT = mqtt
        self._SOCKETIO = socketio
        print("RelayMQTT Init successful")

    def run(self, app):
        assert self._MQTT is not None, "MQTT not initialized"
        assert self._SOCKETIO is not None, "SocketIO not initialized"
        print("Initializing mqtt relay")
        self._MQTT.init_app(app)
        print("Running server...")
        self._SOCKETIO.run(app, host='0.0.0.0', port=5001, debug=False, allow_unsafe_werkzeug=True)
