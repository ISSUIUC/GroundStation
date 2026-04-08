from flask import Flask, current_app
from flask_cors import CORS
from util.relay_mqtt import RelayMqtt
import serial

app = Flask(__name__)

CORS(app)

relay_mqtt = RelayMqtt(app)

@app.route('/list_ports')
def list_ports():
	serial.util.list_ports()

if __name__ == '__main__':
    print("Starting server...")
    relay_mqtt.run(app)
    