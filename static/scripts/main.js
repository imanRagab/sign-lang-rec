$(document).ready(function() {
    var video = document.getElementById("videoElement");
    var videoRecord = document.getElementById("videoRecordElement");
    var camBtn = document.getElementById("camBtn");
    var recBtn = document.getElementById("recBtn");
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var appUrl = window.location.protocol + '//' + document.domain + ':' + location.port
    var socket = io.connect(appUrl);
    const FPS = 6;
    var facingMode = "user"; 
    var constraints = { audio: false, video: { facingMode: facingMode } }; 
    var camStatus = false;
    var recStatus = false;
    var recordInterval
    var videoPlaceholder = document.getElementById('videoPlaceholder')

    socket.on('connect', function(){
        console.log("Connected...!", socket.connected)
    });

    camBtn.addEventListener("click", handleCamera);
    recBtn.addEventListener("click", handleVideoRecord);


    function handleCamera() {

        camBtn.innerText = camStatus ? "Start" : "Stop"
        camBtn.className = camStatus ? "btn btn-success" : "btn btn-danger";
        if(!camStatus) { 
            recBtn.disabled = false;
            handleVideo('stream') 
            navigator.mediaDevices.getUserMedia(constraints)
                            .then(function success(stream) { 
                                video.srcObject = stream;
                                video.play();
                            });
        } else {
            stopStreamedVideo(video);
            recBtn.disabled = true;
            handleVideo();
            if (recStatus) handleVideoRecord();
        }
        camStatus = !camStatus;    
    }

    async function handleVideoRecord() {
        recBtn.innerText = recStatus ?  "Start Recording" : "Stop Recording";
        recBtn.className = recStatus ?  "btn btn-success" : "btn btn-danger";
        // record streaming
        await sendRecordRequest()
        if (!recStatus) {
            recordInterval = setInterval(() => {
                width=video.width;
                height=video.height;
                context.drawImage(video, 0, 0, width , height);
                var data = canvas.toDataURL('image/jpeg', 0.5);
                context.clearRect(0, 0, width,height );
                socket.emit('image', data);
            }, 1000/FPS);
        } else {
            clearInterval(recordInterval);
            handleVideo('record');
        }
        recStatus = !recStatus;
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
            data: { 'start' : !recStatus},
            success: function(data){
                if(!recStatus) {
                    let videoUrl = appUrl + '/' + data.video_name
                    let source = document.createElement('source');
                    source.src = videoUrl;
                    source.type = 'video/mp4'
                    videoRecord.innerHTML = '';
                    videoRecord.appendChild(source);
                    videoRecord.play();
                }
            }
        });
    }

    // this function handle which will appear between (default placeholder, camera stream, recorded video)
    function handleVideo(mode='') {
        switch(mode) {
            case 'stream':
                videoPlaceholder.style.display = "none";     
                video.style.display = "block";
                videoRecord.style.display = "none"; 
                break;
            case 'record':
                videoPlaceholder.style.display = "none";     
                video.style.display = "none";
                videoRecord.style.display = "block"; 
                break;
            default:
                videoPlaceholder.style.display = "block";     
                video.style.display = "none";
                videoRecord.style.display = "none"; 
        }

    }


});
