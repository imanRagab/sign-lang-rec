from flask import Flask, render_template, request
import datetime
from flask import send_from_directory  
import os

global rec, out, video_name

rec = False

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')
    
@app.route('/save-record', methods=['POST'])
def save_record():
    global video_name
    now = datetime.datetime.now()
    uploadDir = 'media'
    if not os.path.exists(uploadDir):
        os.makedirs(uploadDir)
    video_name = 'media/vid_{}.webm'.format(str(now).replace(":", '').replace(" ", '').replace('.', ''))
    video = request.files['video']
    video.save(video_name)
    return {'video_name': video_name}

@app.route('/favicon.ico') 
def favicon(): 
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route("/media/<path:path>")
def media_dir(path):
    return send_from_directory("media", path)

if __name__ == '__main__':
    app.run() 
