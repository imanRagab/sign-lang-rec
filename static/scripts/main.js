$(document).ready(function() {
    var video = document.getElementById("videoElement");
    var camBtn = document.getElementById("camBtn");
    var recBtn = document.getElementById("recBtn");
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var socket = io.connect(window.location.protocol + '//' + document.domain + ':' + location.port);
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
                videoPlaceholder.style.display = "none";      
                navigator.mediaDevices.getUserMedia(constraints)
                                .then(function success(stream) { 
                                    video.srcObject = stream;
                                    video.play();
                                });
            } else {
                stopStreamedVideo(video);
                recBtn.disabled = true;
                videoPlaceholder.style.display = "block";      
                if (recStatus) handleVideoRecord();
            }
        camStatus = !camStatus;    
    }

    async function handleVideoRecord() {
        recBtn.innerText = recStatus ?  "Start Recording" : "Stop Recording";
        recBtn.className = recStatus ?  "btn btn-success" : "btn btn-danger";
        // @todo
        // record streaming
        await sendRecordRequest()
        if (!recStatus) {
            recordInterval = setInterval(() => {
                width=video.width;
                height=video.height;
                context.drawImage(video, 0, 0, width , height );
                var data = canvas.toDataURL('image/jpeg', 0.5);
                context.clearRect(0, 0, width,height );
                socket.emit('image', data);
            }, 1000/FPS);
        } else {
            clearInterval(recordInterval);
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
        });
    }

});
