from flask import Flask, render_template, Response
from flask_cors import CORS
import cv2
import threading
from gevent.pywsgi import WSGIServer
import time
import json
from datetime import datetime
import math
import threading

class Camera:
    def __init__(self, capture_index=0):
        print("Opening stream")
        self.cap = cv2.VideoCapture(capture_index)  # Using the default webcam (index 0)
        print("cap opened")
        self.__recording = False
        self.__rec_debounce_cur = 0
        self.__rec_toggle = False
        self.__rec_debounce_time = 1
        self.__video_out = None

        self.__width = -1
        self.__height = -1

        self.lock = threading.Lock()
        self.frames = []


    def start_recording(self, framerate=60, force_width=-1, force_height=-1):

        self.__height = force_height if (self.__height == -1) else self.__height
        self.__width = force_width if (self.__width == -1) else self.__width

        if (self.__height == -1 or self.__width == -1):
            return False, "Cannot start recording"
    
        self.__rec_debounce_cur = datetime.now().timestamp() + self.__rec_debounce_time
        self.__rec_toggle = True
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        name = f'./outputs/output_{int(datetime.now().timestamp())}.avi'
        self.__video_out = cv2.VideoWriter(name, fourcc, framerate, (self.__width,self.__height))
        self.__recording = True
        return True, name

    def stop_recording(self):
        self.__recording = False
        self.__video_out.release()
        self.__video_out = None

    def handle_record(self, frame):
        if(self.__recording):
            self.__video_out.write(frame)

            # Handle vis
            ts = datetime.now().timestamp()
            if self.__rec_debounce_cur - ts <= 0:
                self.__rec_debounce_cur = ts + self.__rec_debounce_time
                self.__rec_toggle = not self.__rec_toggle

            if self.__rec_toggle:
                cv2.circle(frame, (10,15), 5, (100,100,255), -1)
            cv2.putText(frame, "REC", (20, 20), cv2.FONT_HERSHEY_PLAIN, 1, (100,100,255), 2, cv2.LINE_4, bottomLeftOrigin=False)
            


    def capture_frames(self):
        while True:
            success, frame = self.cap.read()
            if not success:
                break

            self.__height = frame.shape[0]
            self.__width = frame.shape[1]

            time = datetime.now()

            date_str = time.strftime("%m/%d/%y  %H:%M:%S")
            ms_str = str(math.floor(time.microsecond / 1e3))
            ms_time = "." + ("0" * (3-len(ms_str))) + ms_str

            

            self.handle_record(frame)

            cv2.putText(frame, date_str + ms_time, (430, 470), cv2.FONT_HERSHEY_PLAIN, 1, (255,255,255), 2, cv2.LINE_4, bottomLeftOrigin=False)

            cv2.imshow('Video output (Streaming to http://localhost:5002/video_feed)',frame)
            cv2.waitKey(1)
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            with self.lock:
                self.frames = [frame_bytes]

    def get_frame(self):
        with self.lock:
            return self.frames[-1]
        
    def cleanup():
        cv2.destroyAllWindows()

app = Flask(__name__)

CORS(app)

print("Opening camera stream..")
camera = Camera(1)
print("Opened camera stream.")
thread = threading.Thread(target=camera.capture_frames)
thread.daemon = True
thread.start()

@app.route('/')
def index():
    print("Rendering index..")
    temp = render_template('index.html')
    print(temp)
    return temp

def generate_frames():
    while True:
        
        frame = camera.get_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/ping')
def ping():
    return "OK"

@app.route('/start_recording')
def start_recording():
    ok, name = camera.start_recording(30)
    if ok:
        return name, 200
    else:
        return  "Unable", 500



@app.route('/stop_recording')
def stop_recording():
    camera.stop_recording()
    return "OK"

if __name__ == '__main__':
    print("Initializing http server..")
    http_server = WSGIServer(('0.0.0.0', 5002), app)
    print("Initialized video stream server at localhost:5002")
    http_server.serve_forever()
