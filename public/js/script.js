const socket = io('/')
const videoGrid = document.getElementById("video-grid");

const $messageForm = document.getElementById('message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $messages = document.querySelector("#display-messages");
const $emojiButton = document.getElementById("emoji-button");

const $screenShareBtn = document.getElementById('screen-share-button')
const $screenShareVideo = document.getElementById('screen-share-video');

// Templates
const sentMessageTemplate = document.querySelector("#sent-message-template").innerHTML;
const recievedMessageTemplate = document.querySelector('#recieved-message-template').innerHTML;
const adminMessageTemplate = document.querySelector('#admin-message-template').innerHTML;

let username = USER_NAME;
//prompt("Enter Your Name ");

var myPeer = new Peer()
const peers = {}
var currentPeer;

let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true

//=================== prompting permission of media usage to user ===================//
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then((stream) => {
    myVideoStream = stream
    addVideoStream(myVideo, stream)
    
    // Answering the call ---------------------------------------------------------//
    myPeer.on('call', (call)=>{
        call.answer(stream)
        // adding caller's stream on our page
        const video = document.createElement('video')
        call.on('stream', (callersStream) => {
            currentPeer = call.peerConnection;
            // console.log('Peer ::', currentPeer);
            addVideoStream(video, callersStream)
        })
    })

    // sending our stream to new user/ calling to new user
    socket.on('user-joined', (userId, username) => {
        connectToNewUser(userId, stream)
    })
}).catch(error => {
    // alert message pop up
    console.log('Please allow web cam and voice', error);
}) 


//========================= Utils/ Custom Functions ======================================//
// adding user's stream in myVideo element
const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play()
    })
    videoGrid.append(video)
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
          document.getElementsByTagName("video")[index].style.width =
            100 / totalUsers + "%";
        }
    }
}
// sending our stream to new user --------------------------------------------------------//
const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream)

    const video = document.createElement('video')
    // when we call user, the user send back their video stream
    call.on('stream', (userVideoStream) => {
        // we'll add it on our html page
        currentPeer = call.peerConnection;
        // console.log('calling peer:', currentPeer);
        addVideoStream(video, userVideoStream)
    })

    call.on('close', ()=>{
        video.remove()
    })

    peers[userId] = call
}

const scrollToBottom = () => {
    var chatWindow = $('.side-bar__chat-box');
    chatWindow.scrollTop(chatWindow.prop("scrollHeight"));
}

//============================ Screen Share ======================================//
$screenShareBtn.addEventListener('click', (e) => {
    // console.log('Screen share button clicked');
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true
        }
    }).then((stream) => {
        var screenTrack = stream.getVideoTracks()[0];
        var senders = currentPeer.getSenders().find((s) => {
            return s.track.kind == screenTrack.kind
        })
        senders.replaceTrack(screenTrack);
    }).catch((err) => {
        console.log("Unable to display media.", err);
    })

})




//========================== Audio/Video Toggle ================================//
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
}
const setMuteButton = () => {
    const html = `<i class="fas fa-microphone" ></i>`
    document.querySelector('.mute-button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `<i class="unmute fas fa-microphone-slash"></i>`
    document.querySelector('.mute-button').innerHTML = html;
}

const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideoButton()
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        setStopVideoButton()
    }
}

const setPlayVideoButton = () => {
    const html = ` <i class="fas fa-video-slash"></i> `
    document.querySelector('.video-button').innerHTML = html;
}

const setStopVideoButton = () => {
    const html = `<i class="fas fa-video"></i>`
    document.querySelector('.video-button').innerHTML = html;
}

//================= When peer object is created, user joins a room ==========================//
myPeer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id, username);
})

//======================= chat messages rendering ===============================//
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageButton.disabled = true;
    const message = e.target.elements.messageInput.value;

    socket.emit('sendMessage', message, (error) => {
        $messageButton.disabled = false
        $messageInput.value = ''
        $messageInput.focus()
        if(error) {
            return console.log(error);
        }
        console.log('delivered');
    });

    const htmlvar = Mustache.render(sentMessageTemplate,  {
        username: 'You',
        createdAt: moment(new Date().getTime()).format('h:mm a'),
        message: message
    })

    $messages.insertAdjacentHTML('beforeend', htmlvar);
    scrollToBottom()
})

var picker = new EmojiButton({position: 'left-end'});
picker.on('emoji', (emoji) => {
    $messageInput.value += emoji;
})

$emojiButton.addEventListener('click', () => {
    picker.pickerVisible ? picker.hidePicker() : picker.showPicker($emojiButton);
})


socket.on('createMessage', ({username, msg, createdAt}) => {
    const html = Mustache.render(recievedMessageTemplate, {
        username: username,
        createdAt: moment(createdAt).format('h:mm a'),
        message: msg
    })
    $messages.insertAdjacentHTML('beforeend', html);
    scrollToBottom()
})

//============================= Raise hand ========================================//
const raiseHand = () => {
    socket.emit('raise-hand');
}

socket.on('handRaised', (username) => {
    const html = Mustache.render(adminMessageTemplate, {
        icon: '<i class="fas fa-hand-paper"></i>',
        username: username,
        info: ' has raised hand.'
    })
    $messages.insertAdjacentHTML('beforeend', html);
    scrollToBottom()
})

//======================== Listening: User joined/left from server ===============================//
// temp messages on screen
socket.on('user-joined', (userId, username) => {
    const html = Mustache.render(adminMessageTemplate, {
        icon: '<i class="fas fa-user-plus"></i>',
        username: username,
        info: ' has joined the chat.'
    })
    $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('user-disconnected', (userId, username) => {
    const html = Mustache.render(adminMessageTemplate, {
        icon: '<i class="fas fa-user-minus"></i>',
        username: username,
        info: ' has left the chat.'
    })
    $messages.insertAdjacentHTML('beforeend', html);
    scrollToBottom()
    if(peers[userId]) peers[userId].close()
})