$(document).ready(function() {
    var video = document.getElementById("videoElement");
    var videoRecord = document.getElementById("videoRecordElement");
    var camBtn = document.getElementById("camBtn");
    var recBtn = document.getElementById("recBtn");
    var predBtn = document.getElementById("predBtn");
    var predtxt = document.getElementById("pred");
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var appUrl = window.location.protocol + '//' + document.domain + ':' + location.port
    var socket = io.connect(appUrl);
    const FPS = 200;
    var facingMode = "user"; 
    var constraints = { audio: false, video: { facingMode: facingMode } }; 
    var camStatus = false;
    var recStatus = false;
    var recordInterval
    var videoPlaceholder = document.getElementById('videoPlaceholder')
    var mediaRecorder;
    var blobsRecorded = [];

    socket.on('connect', function(){
        console.log("Connected...!", socket.connected)
    });

    camBtn.addEventListener("click", handleCamera);
    recBtn.addEventListener("click", handleVideoRecord);
    predBtn.addEventListener("click", handlePrediction);

    function handleCamera() {

        camStatus = !camStatus;    
        camBtn.innerText = !camStatus ? "Open Camera" : "Stop Camera"
        camBtn.className = !camStatus ? "btn btn-success" : "btn btn-danger";
        if(camStatus) { 
            recBtn.disabled = false;
            handleVideo('stream') 
            navigator.mediaDevices.getUserMedia(constraints)
                            .then(function success(stream) { 
                                video.srcObject = stream;
                                video.play();
                            });
        } else {
            stopCamera();
        }
    }

    async function handleVideoRecord() {
        recStatus = !recStatus;
        recBtn.innerText = !recStatus ?  "Start Recording" : "Stop Recording";
        recBtn.className = !recStatus ?  "btn btn-success" : "btn btn-danger";
        // record streaming
        await sendRecordRequest()
        if (recStatus) {
            blobsRecorded = [];
            clientRecord();
            recordInterval = setInterval(() => {
                width=video.width;
                height=video.height;
                context.drawImage(video, 0, 0, width , height);
                var data = canvas.toDataURL('image/jpeg', 0.5);
                context.clearRect(0, 0, width,height );
                socket.emit('image', data);
            }, 1000/FPS);
        } else {
            stopRecord();
        }
    }

    function handlePrediction() {
        // @todo
        // call model prediction api
        predtxt.innerHTML = "Prediction"
        predBtn.disabled = true;
    }

    function stopCamera() {
        stopStreamedVideo(video);
        recBtn.disabled = true;
        if (recStatus) handleVideoRecord();
        handleVideo();
    }

    function stopRecord() {
        mediaRecorder.stop(); 
        clearInterval(recordInterval);
        if (camStatus) { 
            playRecord();
            handleCamera();
            handleVideo('record');
        }
    }    

    function stopStreamedVideo(videoElem) {
        const stream = videoElem.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(function(track) {
            track.stop();
        });
        videoElem.srcObject = null;
    }

    function sendRecordRequest() {
        $.ajax({
            type: "GET",
            url: '/record',
            data: { 'start' : recStatus}
        });
    }

    // this function handle which will appear between (default placeholder, camera stream, recorded video)
    function handleVideo(mode='') {
        switch(mode) {
            case 'stream':
                videoPlaceholder.style.display = "none";     
                video.style.display = "block";
                videoRecord.style.display = "none"; 
                predBtn.disabled = true
                predtxt.innerHTML = "Predicted word will appear here"
                break;
            case 'record':
                videoPlaceholder.style.display = "none";     
                video.style.display = "none";
                videoRecord.style.display = "block"; 
                predBtn.disabled = false
                break;
            default:
                videoPlaceholder.style.display = "block";     
                video.style.display = "none";
                videoRecord.style.display = "none"; 
        }

    }


    function clientRecord() {
        mediaRecorder = new MediaRecorder(video.srcObject, { mimeType: 'video/webm' });  
        mediaRecorder.addEventListener('dataavailable', function(e) {
            blobsRecorded.push(e.data);      
        });
        mediaRecorder.start(1000);
    }
    
    function playRecord() {
        var type = (blobsRecorded[0] || {}).type;
        var superBuffer = new Blob(blobsRecorded, {type});
        videoRecord.src = window.URL.createObjectURL(superBuffer);
    }
});