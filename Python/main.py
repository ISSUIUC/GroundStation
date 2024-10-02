from flask import Flask, render_template, redirect, url_for, request

app = Flask(__name__)

# Counter variable
counter = 0

@app.route('/')
def index():
    global counter
    return render_template('index.html', counter=counter)

@app.route('/increment', methods=['POST'])  # Allow POST method
def increment():
    global counter
    counter += 1
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Use '0.0.0.0' to make the app accessible to other devices on the same network
    app.run(host='0.0.0.0', port=5000)
