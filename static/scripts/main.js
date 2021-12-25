var video = document.createElement('video');
var camBtn = document.getElementById("camBtn");
var recBtn = document.getElementById("recBtn");

video.setAttribute('playsinline', '');
video.setAttribute('autoplay', '');
video.setAttribute('muted', ''); 
video.style.width = '200px'; 
video.style.height = '200px';
document.getElementById('videoDiv').appendChild(video);

var facingMode = "user"; 
var constraints = { audio: false, video: { facingMode: facingMode } }; 
var camStatus = false;
var recStatus = false;

camBtn.addEventListener("click", function () { 

    camBtn.innerText = camStatus ? "Start" : "Stop"
    camBtn.className = camStatus ? "btn btn-success" : "btn btn-danger";
    if(!camStatus) {        
        navigator.mediaDevices.getUserMedia(constraints)
                        .then(function success(stream) { 
                            video.srcObject = stream; 
                        });
    } else {
        stopStreamedVideo(video);
    }
    camStatus = !camStatus;
});


recBtn.addEventListener("click", function () { 
    recBtn.innerText = recStatus ?  "Start Recording" : "Stop Recording";
    recBtn.className = recStatus ?  "btn btn-success" : "btn btn-danger";
    recStatus = !recStatus;
    // @todo
    // record streaming
});


function stopStreamedVideo(videoElem) {
    const stream = videoElem.srcObject;
    const tracks = stream.getTracks();
  
    tracks.forEach(function(track) {
      track.stop();
    });
  
    videoElem.srcObject = null;
}
