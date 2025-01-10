from flask import Flask, current_app
from flask_cors import CORS
from util.relay_mqtt import RelayMqtt

app = Flask(__name__)
app.config['MQTT_BROKER_URL'] = 'mqtt'
app.config['MQTT_BROKER_PORT'] = 1884

CORS(app)

relay_mqtt = RelayMqtt(app)

@app.route('/')
def hello():
	return "Hello World!"

if __name__ == '__main__':
    print("Starting server...")
    relay_mqtt.run(app)
    