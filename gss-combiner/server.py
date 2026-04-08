from flask import Flask, current_app
from flask_cors import CORS
from serial.tools.list_ports import comports
from flask import request
from flask import jsonify
import threading
import standalone

def get_feather_duo_ports():
    """
    Gets the ports of connected Feather Duos

    Returns:
        list: list of connected Feather Duos
    """
    FEATHER_DUO_PID = 4097
    return [port.device for port in comports() if port.pid == FEATHER_DUO_PID]


app = Flask(__name__)

thread_pool = {}

def feather_connection(port, ip, stage, should_log):
    try:
        t = standalone.TelemetryStandalone(port, ip, stage, should_log)
        t.run()
    except:
        print("Failed!")
        return False
    return True


def start_thread(port, ip, stage, should_log):
    print(port)
    if port in thread_pool:
        if thread_pool[port].is_alive():
            return False
    t = threading.Thread(target=feather_connection, args=(port, ip, stage, should_log))
    thread_pool[port] = t
    return True

CORS(app)

@app.route('/ports')
def list_ports():
	return jsonify({"devices": get_feather_duo_ports()})

@app.route('/feathers')
def list_feathers():
    ... # List all the data related to the feather

@app.route('/connect_port', methods=["POST"])
def connect_port():
	# Run the new process in a separate thing
    if "port" in request.json:
         # Then that is our comport
        if request.json["port"] not in get_feather_duo_ports():
            return jsonify({"failure": "Port does not exist"}), 503
        port = request.json["port"]
    else:
        return jsonify({"failure": "Malformed request"}), 400
    
    no_log = False
    if "no_log" in request.json:
        no_log = request.json["no_log"]
        if not isinstance(no_log, bool):
            no_log = False
    
    if "ip" in request.json:
        ip = request.json["ip"]
    else:
        ip = request.remote_addr
    # Assume feather duo
    if start_thread(port, ip, "Multistage", not no_log):
        return jsonify({"address": ip})
    else:
        return jsonify({"failure": "Feather is already connected to!"}), 400
