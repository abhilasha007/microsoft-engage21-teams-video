const socket = io('/')
const videoGrid = document.getElementById("video-grid");
const videoGrid_wr = document.querySelector('.waiting_room__video');

const $messageForm = document.getElementById('message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $messages = document.querySelector("#display-messages");
const $emojiButton = document.getElementById("emoji-button");

const $fullScreen = document.getElementById('full-screen-btn');
const $screenShareBtn = document.getElementById('screen-share-button')
const $screenShareVideo = document.getElementById('screen-share-video');

const $peopleBtn = document.getElementById('people-button');
const $sidebarForm = document.querySelector('.side-bar__form');
const $sidebarChat = document.querySelector('.side-bar__chat-box');

// Templates
const sentMessageTemplate = document.querySelector("#sent-message-template").innerHTML;
const recievedMessageTemplate = document.querySelector('#recieved-message-template').innerHTML;
const adminMessageTemplate = document.querySelector('#admin-message-template').innerHTML;
const peopleInChatTemplate = document.querySelector('#people-in-chat').innerHTML;

const main__app = document.getElementById('main_app');
const waiting__room = document.querySelector('.waiting_room');
const joinBtn = document.querySelector('.joincall_btn');

main__app.style.visibility = "hidden";
joinBtn.addEventListener('click', () => {
    console.log('clicked');
    main__app.style.visibility = "visible";
    waiting__room.style.visibility = "hidden";
    waiting__room.style.zIndex = "-11";
})

let username = USER_NAME;

var myPeer = new Peer()
const peers = {}
var currentPeer;

//======================== When peer object is created, user joins a room ==========================//
myPeer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id, username);
})

//=========================== prompting permission of media usage to user ======================//
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then((stream) => {
    myVideoStream = stream
    myVideoStream.getVideoTracks()[0].enabled = false;
    myVideoStream.getAudioTracks()[0].enabled = false;

    addVideoStream(myVideo, stream)
    const myVideo_wr = document.createElement('video')
    addVideoStreamInWR(myVideo_wr, stream);

    // Answering the call --------------------------------------------//
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
    console.log('Please allow web cam and voice', error);
}) 

//======================================== UTILS ===============================================//
// adding user's stream in myVideo element
const addVideoStreamInWR = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play()
    })
    video.className = "video_wr";
    videoGrid_wr.append(video);
}
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
// sending our stream to new user ---------------------------------------//
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

//============================ SCREEN SHARE ======================================//
$screenShareBtn.addEventListener('click', (e) => {
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

//============================== AUDIO/VIDEO TOGGLE ===================================//
// Wait room
const muteUnmute_wr = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton('.mute-button_wr');
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton('.mute-button_wr');
    }
}

const playStop_wr = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideoButton('.video-button_wr')
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        setStopVideoButton('.video-button_wr')
    }
}

// Main app
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton('.mute-button');
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton('.mute-button');
    }
}
const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideoButton('.video-button')
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        setStopVideoButton('.video-button')
    }
}

const setMuteButton = ( className ) => {
    const html = `<i class="fas fa-microphone" ></i>`;
    document.querySelector(`${className}`).innerHTML = html;
}
const setUnmuteButton = (className) => {
    const html = `<i class="unmute fas fa-microphone-slash"></i>`
    document.querySelector(`${className}`).innerHTML = html;
}
const setPlayVideoButton = (className) => {
    const html = ` <i class="fas fa-video-slash"></i> `
    document.querySelector(`${className}`).innerHTML = html;
}
const setStopVideoButton = (className) => {
    const html = `<i class="fas fa-video"></i>`
    document.querySelector(`${className}`).innerHTML = html;
}



//=========================== CHAT MESSAGES rendering ===============================//
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

//=================================== RAISE HAND =============================================//
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

//==================================== FULL SCREEN =================================================//
$fullScreen.addEventListener('click', (e) => {
    toggleFullScreen();
})

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
}
  
//======================== Listening: USER LEFT/ JOINED from server ===============================//
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

//==================================== ROOM DATA =================================//
socket.on('roomData', ({users}) => {
    console.log(users);
    const html = Mustache.render(peopleInChatTemplate, {
        users
    })
    document.querySelector('.people').innerHTML = html;

})

//======================== COPY TO CLIPBOARD ==================================//
document.querySelector('.icon-clip').addEventListener('click', (e) => {
    document.execCommand("Copy");
})

//=============================== TIMER ==================================//
let [milliseconds,seconds,minutes,hours] = [0,0,0,0];
let timerRef = document.querySelector('.timerDisplay');
let int = null;

// document.getElementById('startTimer').addEventListener('click', ()=>{
    if(int!==null){
        clearInterval(int);
    }
    int = setInterval(displayTimer,10);
// });


function displayTimer(){
    milliseconds+=10;
    if(milliseconds == 1000){
        milliseconds = 0;
        seconds++;
        if(seconds == 60){
            seconds = 0;
            minutes++;
            if(minutes == 60){
                minutes = 0;
                hours++;
            }
        }
    }
    let h = hours < 10 ? "0" + hours : hours;
    let m = minutes < 10 ? "0" + minutes : minutes;
    let s = seconds < 10 ? "0" + seconds : seconds;
    let ms = milliseconds < 10 ? "00" + milliseconds : milliseconds < 100 ? "0" + milliseconds : milliseconds;

    timerRef.innerHTML = ` ${h} : ${m} : ${s} `;
}