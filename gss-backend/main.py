import json
import os
import socket
from flask import Flask, current_app
from flask_cors import CORS
import util.relay_mqtt as relay_module
from util.relay_mqtt import RelayMqtt

DS_PATH = '/app/config/data_source.json'
DS_DEFAULT = {'host': 'localhost', 'port': 1884}

def load_data_source():
	ds = dict(DS_DEFAULT)
	if os.path.exists(DS_PATH):
		try:
			with open(DS_PATH, 'r') as f:
				ds.update(json.load(f))
		except (json.JSONDecodeError, OSError) as e:
			print(f"Warning: failed to load {DS_PATH}: {e}", flush=True)
	# Drop any legacy keys we no longer use
	ds.pop('enabled', None)
	return ds

def resolve_broker(host):
	# From inside the backend container, 'localhost' means the container itself.
	# Alias it (and 127.0.0.1) to the docker service name so users can type the
	# intuitive 'localhost' in the UI and have it reach the local mosquitto.
	if host in ('localhost', '127.0.0.1', ''):
		return 'mqtt'
	return host

def can_reach(host, port, timeout=3):
	try:
		with socket.create_connection((host, port), timeout=timeout):
			return True
	except (socket.timeout, ConnectionRefusedError, OSError):
		return False

ds = load_data_source()
relay_module.CONFIGURED_HOST = ds['host']
relay_module.CONFIGURED_PORT = int(ds['port'])

broker_host = resolve_broker(ds['host'])
broker_port = int(ds['port'])

# Pre-flight the broker. If unreachable, fall back to local so the UI stays up.
# User's config is preserved in data_source.json; UI shows a degraded banner.
if not can_reach(broker_host, broker_port):
	print(f"Pre-flight: cannot reach {ds['host']}:{ds['port']} (resolved {broker_host}:{broker_port}). Falling back to local mqtt.", flush=True)
	broker_host = 'mqtt'
	broker_port = 1884
	relay_module.DS_DEGRADED = True

relay_module.EFFECTIVE_HOST = broker_host
relay_module.EFFECTIVE_PORT = broker_port

print(f"MQTT broker (configured): {ds['host']}:{ds['port']}", flush=True)
print(f"MQTT broker (effective):  {broker_host}:{broker_port} (degraded={relay_module.DS_DEGRADED})", flush=True)

app = Flask(__name__)
app.config['MQTT_BROKER_URL'] = broker_host
app.config['MQTT_BROKER_PORT'] = broker_port

CORS(app)

relay_mqtt = RelayMqtt(app)

@app.route('/')
def hello():
	return "Hello World!"

if __name__ == '__main__':
    print("Starting server...")
    relay_mqtt.run(app)
