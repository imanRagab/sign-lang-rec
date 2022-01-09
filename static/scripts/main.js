$(document).ready(function() {
    var video = document.getElementById("videoElement");
    var videoRecord = document.getElementById("videoRecordElement");
    var camBtn = document.getElementById("camBtn");
    var recBtn = document.getElementById("recBtn");
    var predBtn = document.getElementById("predBtn");
    var uploadBtn = document.getElementById("uploadBtn");
    var uploadForm = document.getElementById("uploadForm")
    var predtxt = document.getElementById("pred");
    var appUrl = window.location.protocol + '//' + document.domain + ':' + location.port
    var facingMode = "user"; 
    var constraints = { audio: false, video: { facingMode: facingMode } }; 
    var camStatus = false;
    var recStatus = false;
    var videoPlaceholder = document.getElementById('videoPlaceholder')
    var mediaRecorder;
    var blobsRecorded = [];
    var blob;
    var recordMode;

    ///////// Event Listeners ////////////

    camBtn.addEventListener("click", handleCamera);
    recBtn.addEventListener("click", handleVideoRecord);
    predBtn.addEventListener("click", handlePrediction);
    uploadBtn.addEventListener("click", handleUpload);
    uploadForm.addEventListener('submit', function (event) {
        event.preventDefault();
    });

    function handleCamera() {
        camStatus = !camStatus;    
        camBtn.innerText = !camStatus ? "Open Camera" : "Stop Camera"
        camBtn.className = !camStatus ? "btn btn-success" : "btn btn-danger";
        if(camStatus) { 
            openCamera();
        } else {
            stopCamera();
        }
    }

    function handleVideoRecord() {
        recStatus = !recStatus;
        recBtn.innerText = !recStatus ?  "Start Recording" : "Stop Recording";
        recBtn.className = !recStatus ?  "btn btn-success" : "btn btn-danger";
        if (recStatus) {
            startRecord();
        } else {
            stopRecord();
        }
    }

    function handlePrediction() {
        predBtn.disabled = true;
        if (recordMode == 'cam') saveRecord();
        predtxt.innerHTML = getModelPrediction();
    }

    function handleUpload() {
        var form = new FormData(uploadForm);
        recordMode = 'file'
        uploadRecord(form);
    }


    ///////// Helper Functions ////////////

    function openCamera() {
        recBtn.disabled = false;
        handleVideo('stream') 
        navigator.mediaDevices.getUserMedia(constraints)
                        .then(function success(stream) { 
                            video.srcObject = stream;
                            video.play();
                        });
    }

    function stopCamera() {
        stopStreamedVideo(video);
        recBtn.disabled = true;
        if (recStatus) handleVideoRecord();
        handleVideo();
    }

    function stopRecord() {
        mediaRecorder.stop(); 
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

    /* this function handle which will appear between 
     (default placeholder, camera stream, recorded video) 
    */
    function handleVideo(mode='') {
        predtxt.innerHTML = "Predicted word will appear here"
        switch(mode) {
            case 'stream':
                videoPlaceholder.style.display = "none";     
                video.style.display = "block";
                videoRecord.style.display = "none"; 
                predBtn.disabled = true
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

    function startRecord() {
        recordMode = 'cam'
        mediaRecorder = new MediaRecorder(video.srcObject, { mimeType: 'video/webm' });  
        mediaRecorder.addEventListener('dataavailable', function(e) {
            blobsRecorded.push(e.data);      
        });
        mediaRecorder.addEventListener('stop', function() {
            blob = new Blob(blobsRecorded, {
                'type': "video/x-matroska;codecs=avc1"
            });
            blobsRecorded = [];
        });
        mediaRecorder.start(1000);
    }
    
    function playRecord() {
        var type = (blobsRecorded[0] || {}).type;
        var superBuffer = new Blob(blobsRecorded, {type});
        videoRecord.src = window.URL.createObjectURL(superBuffer);
    }

    function saveRecord() {
        let form = new FormData();
        form.append('video',  blob);
        uploadRecord(form);
    }

    function uploadRecord(data) {
        $.ajax({
            type: 'POST',
            url: '/save-record',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            responseType: 'blob',
            enctype: 'multipart/form-data',
        }).done(function(data) {
            if (recordMode == 'file') {
                videoRecord.src = appUrl + '/' + data.video_name;
                handleVideo('record');
            }
        });

    }

    function getModelPrediction() {
        /* @todo
         call model prediction api 
        */
        return "Prediction"; // currently temp text
    }
});