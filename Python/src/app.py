from flask import Flask, render_template
import os

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), '../templates'))

# Initialize the counter
counter = 0

@app.route('/')
def home():
    global counter
    counter += 1  # Increment the counter
    return render_template('index.html', count=counter)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

