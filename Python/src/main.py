from flask import Flask, render_template, jsonify
from flask_meld import Meld
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    # Load telemetry data from test_data.json
    with open(os.path.join('data', 'test_data.json')) as f:
        telemetry_data = json.load(f)
    return render_template('index.html', telemetry=telemetry_data)

@app.route('/reload', methods=['GET'])
def reload():
    # Load telemetry data again from test_data.json
    with open(os.path.join('data', 'test_data.json')) as f:
        telemetry_data = json.load(f)
    
    # Redirect to the main page with updated data
    return render_template('index.html', telemetry=telemetry_data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Host for accessibility on the same network
