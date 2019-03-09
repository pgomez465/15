const socket = io();

socket.on('connect', () => {
    console.log('Connected to Server');
});

socket.on('disconnect', () => {
    console.log('Server disconnected');
});

let pc = null;

function onError(err) {
    console.log('Error: ', err);
}

function onIceCandidate(evt) {
    console.log('Got ICE Candidate');
    if(evt.candidate) {
        socket.emit('signal', {candidate: evt.candidate});
    }
}

function onAddStream(evt) {
    if(evt.stream) {
        console.log('Got Stream from Remote Peer...');
        let remoteVideo  = document.getElementById('remote-video');
        remoteVideo.srcObject = evt.stream;

        remoteVideo.onloadedmetadata = function(e) {
            remoteVideo.play()
            .then(() => console.log('Video Playback started...'))
            .catch(() => console.log('Video Playback failed...'));
        };
    }
}

function gotOffer(description) {
    console.log("Offer SDP created");
    pc.setLocalDescription(description, () => {
        // Signal SDP to remote peer
        socket.emit('signal', {offer: description});
    });
}

function gotAnswer(description) {
    console.log("Anser SDP created");
    pc.setLocalDescription(description, () => {
        // Signal SDP to remote peer
        socket.emit('signal', {answer: description});
    });
}

function gotMediaStream(stream) {
    // Add local video stream
    console.log('Adding local video stream...');
    let localVideo  = document.getElementById('local-video');
    localVideo.srcObject = stream;
    localVideo.onloadedmetadata = function(e) {
        localVideo.play()
        .then(() => console.log('Local Video Playback started...'))
        .catch(() => console.log('Local Video Playback failed...'));
    };

    // Add the stream to the PC
    // pc.addStream(stream);
    // Add tracks to PC
    stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
    });
    console.log('Added Stream to PC');

    console.log('Sending Offer');
    // Create Session Description(SDP) Offer
    pc.createOffer(gotOffer, onError, {'offerToReceiveAudio': true, 'offerToReceiveVideo': true});
}

function createPeerConnection() {
        //Creating RTC Peer Connection

        let conf = { 
            "iceServers": [{ "urls": "stun:stun.1.google.com:19302" }] 
        };

        pc = new RTCPeerConnection(conf);
        console.log("RTCPeerConnection object created");

        //setup ice handling
        //when the browser finds an ice candidate we send it to another peer 
        pc.onicecandidate = onIceCandidate;

        //setup stream
        //when browser gets the stream from remote peer, save or play it
        pc.onaddstream = onAddStream;
}

function onAddIceCandidate(candidate) {
    pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('Added ICE Candidate');
}

function onOffer(offer) {
    pc.setRemoteDescription(new RTCSessionDescription(offer), () => {
        console.log('Set Remote Offer');

        console.log('Sending Answer');
        // Create SDP Answer 
        pc.createAnswer(gotAnswer, onError);
    });
}

function onAnswer(answer) {
    pc.setRemoteDescription(new RTCSessionDescription(answer), () => {
        console.log('Set Remote Answer');
    });
}

document.getElementById('join').addEventListener('click', () => {
    // Create Peer Connection
    createPeerConnection();
});

document.getElementById('call').addEventListener('click', () => {
    // 1. GetUserMedia
    navigator.getUserMedia(
        //Constraints
        {video: true, audio: false},

        // Success Callback
        gotMediaStream,

        // Error Callback
        onError
);
});

document.getElementById('hangup').addEventListener('click', () => {
    let remoteVideo  = document.getElementById('remote-video');
    remoteVideo.src = null;
});

// Handle remote Signals
socket.on('signal', (msg) => {
    if(msg.candidate) {
        onAddIceCandidate(msg.candidate);
    } else if(msg.offer) {
        onOffer(msg.offer);
    } else if(msg.answer) {
        onAnswer(msg.answer);
    }else {
        console.log('Unknown Message!');
    }
});

