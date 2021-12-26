import cv2
from flask import Flask, render_template, Response, request
import datetime
from flask_socketio import SocketIO
import numpy as np
import base64
from flask import send_from_directory  
import os   

global rec, out

rec = False

app = Flask(__name__)

socketio = SocketIO(app, manage_session=False)

@socketio.event
def connect():
	print("CONNECTED")

@socketio.on('image')
def handle_image(data):
    if rec:
        global out
        image = readb64(data)   
        out.write(cv2.flip(image, 1))

def readb64(base64_string):
    idx = base64_string.find('base64,')
    base64_string  = base64_string[idx+7:]
    jpg_original = base64.b64decode(base64_string)
    jpg_as_np = np.frombuffer(jpg_original, dtype=np.uint8)
    return cv2.imdecode(jpg_as_np, flags=1)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/record', methods=['GET'])
def start_stop_record():
    global rec, out
    print(request.args.get('start'))
    if request.args.get('start') == 'true':
        rec = True
        now = datetime.datetime.now()
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter('./media/vid_{}.avi'.format(str(now).replace(":", '')), fourcc, 20.0, (600, 500))
    else:
        rec = False
        out.release()

    return Response(status = 200)

@app.route('/favicon.ico') 
def favicon(): 
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    socketio.run(app)
