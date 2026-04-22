from flask_mqtt import Mqtt
from flask_socketio import SocketIO, emit
import configparser
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

config = configparser.ConfigParser()
config.read('./config.ini')

def get_telemetry_channels():
    all_channels = []
    for section in config.sections():
        if section.startswith('Telemetry:'):
            channel = {}
            channel['name'] = section.split(':')[1]
            channel['control_channel'] = config[section]['control_channel']
            channel['data_channel'] = config[section]['data_channel']
            channel['default_rf'] = config[section]['default_rf']
            all_channels.append(channel)
    return all_channels

def get_common_channel():
    return config['default']['common_channel']

ALL_CHANNELS = get_telemetry_channels()
GSS_GLOBALS = {}

def update_gss_globals(incoming):
    global GSS_GLOBALS

    for key in incoming:
        GSS_GLOBALS[key] = incoming[key]


class RelayMqtt:
    def __init__(self, app):
        mqtt = Mqtt(app)
        socketio = SocketIO(app, cors_allowed_origins="*")
        self.__gss_globals = {}


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

                # Subscribe to common channel
                mqtt.subscribe(get_common_channel())
                print(f"Subscribed to common channel {get_common_channel()}", flush=True)

                # Subscribe to all telemetry channels
                for channel in ALL_CHANNELS:
                    mqtt.subscribe(channel['data_channel'])
                    mqtt.subscribe(channel['control_channel'])
                    print(f"Subscribed to telemetry channel {channel['name']} ({channel['control_channel']}/{channel['data_channel']})", flush=True)

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
            # print('Received message on topic {}: {}'.format(message.topic, message.payload.decode()), flush=True)

            # parse packet
            msg_payload = json.loads(message.payload)

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
                # Is telemetry packet

                # Determine which channel to interpret as
                payload_channel = msg_payload["metadata"]["raw_stream"]
                for channel in ALL_CHANNELS:
                    if(channel["data_channel"] == payload_channel):
                        msg_payload["metadata"]["stream"] = channel["name"]

                msg_payload["metadata"]["time_republished"] = time.time()
                msg_payload["metadata"]["type"] = "telemetry"

                print(f"Emitting packet (telem)", flush=True)
                socketio.start_background_task(target=emit_mqtt_msg, message=msg_payload)
                return

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
