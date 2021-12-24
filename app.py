import cv2
from flask import Flask, render_template, Response, request
import datetime, time
from threading import Thread

global rec_frame, switch, rec, out

switch = 1
rec = 0

cam = cv2.VideoCapture(0)


def record(out):
    global rec_frame
    while (rec):
        time.sleep(0.05)
        out.write(cv2.flip(rec_frame, 1))


app = Flask(__name__)


def generate_frames():
    global out, rec_frame
    while True:
        if (rec):
            ### read the camera frame
            success, frame = cam.read()
            rec_frame = frame
            frame = cv2.putText(cv2.flip(frame, 1), "Recording...", (0, 25), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255),
                                4)
            frame = cv2.flip(frame, 1)

        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', cv2.flip(frame, 1))
            frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video')
def video():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/requests', methods=['POST', 'GET'])
def tasks():
    global switch, cam
    if request.method == 'POST':

        if request.form.get('stop') == 'Stop/Start':

            if (switch == 1):
                switch = 0
                cam.release()
                cv2.destroyAllWindows()

            else:
                cam = cv2.VideoCapture(0)
                switch = 1
        elif request.form.get('rec') == 'Start/Stop Recording':
            global rec, out
            rec = not rec
            if (rec):
                now = datetime.datetime.now()
                fourcc = cv2.VideoWriter_fourcc(*'XVID')
                out = cv2.VideoWriter('vid_{}.avi'.format(str(now).replace(":", '')), fourcc, 20.0, (640, 480))
                # Start new thread for recording the video
                thread = Thread(target=record, args=[out, ])
                thread.start()
            elif (rec == False):
                out.release()


    elif request.method == 'GET':
        return render_template('index.html')
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)

cam.release()
cv2.destroyAllWindows()
