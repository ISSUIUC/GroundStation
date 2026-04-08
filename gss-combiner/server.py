from flask import Flask, current_app
from flask_cors import CORS
from serial.tools.list_ports import comports
import json

def get_feather_duo_ports():
    """
    Gets the ports of connected Feather Duos

    Returns:
        list: list of connected Feather Duos
    """
    FEATHER_DUO_PID = 4097
    return {"devices": [port.device for port in comports() if port.pid == FEATHER_DUO_PID]}


app = Flask(__name__)

CORS(app)

@app.route('/list_ports')
def list_ports():
	return get_feather_duo_ports()



@app.route('/connect_port')
def list_ports():
	return get_feather_duo_ports()
