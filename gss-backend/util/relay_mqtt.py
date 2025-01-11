from flask_mqtt import Mqtt
from flask_socketio import SocketIO
import configparser
import json
import time

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

class RelayMqtt:
    def __init__(self, app):
        mqtt = Mqtt(app)
        socketio = SocketIO(app, cors_allowed_origins="*")

        @socketio.on("gss")
        def handle_gss_comm(data):
            try:
                data_json = json.loads(data)

                if data_json["source"] == "gss-frontend":
                    print("Decoded msg from frontend", flush=True)

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
                

        @mqtt.on_connect()
        def handle_connect(client, userdata, flags, rc):
            print("Connecting to MQTT broker...", flush=True)
            if rc == 0:
                print("Connected to MQTT broker, subscribing...", flush=True)

                # Subscribe to common channel
                mqtt.subscribe(get_common_channel())
                print(f"Subscribed to common channel {get_common_channel()}", flush=True)

                # Subscribe to all telemetry channels
                for channel in ALL_CHANNELS:
                    mqtt.subscribe(channel['data_channel'])
                    mqtt.subscribe(channel['control_channel'])
                    print(f"Subscribed to telemetry channel {channel['name']} ({channel['control_channel']}/{channel['data_channel']})", flush=True)

            else:
                print(f"Failed to connect to MQTT broker, return code {rc}", flush=True)

        def emit_err_msg(message):
            socketio.emit('mqtt_message', json.dumps(message))

        def emit_mqtt_msg(message):
            socketio.emit('mqtt_message', json.dumps(message))

        @mqtt.on_message()
        def handle_mqtt_message(client, userdata, message):
            # print('Received message on topic {}: {}'.format(message.topic, message.payload.decode()), flush=True)

            # parse packet
            msg_payload = json.loads(message.payload)

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
