# app.py
from flask import Flask, render_template
from src.graph1 import create_graph as create_graph1
from src.graph2 import create_graph as create_graph2
from src.graph3 import create_graph as create_graph3
from src.graph4 import create_graph as create_graph4
from src.graph5 import create_graph as create_graph5

app = Flask(__name__)

@app.route('/')
def index():
    # Create all graphs
    create_graph1()
    create_graph2()
    create_graph3()
    create_graph4()
    create_graph5()
    return render_template('index.html')

if __name__ == '__main__':
    # Replace '192.168.x.x' with your actual local IP address
    app.run(host='0.0.0.0', port=5000, debug=True)
