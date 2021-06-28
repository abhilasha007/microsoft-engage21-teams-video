const socket = io('/')
const videoGrid = document.getElementById("video-grid");

const $tempMessage = document.querySelector("#temp-message")
const $messageForm = document.querySelector('#message-form')
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $messages = document.querySelector("#display-messages");

// Templates
const tempMessageTemplate = document.querySelector("#temp-msg-template").innerHTML;
const messageTemplate = document.querySelector("#message-template").innerHTML;


var myPeer = new Peer()
const peers = {}

const myVideo = document.createElement('video')
myVideo.muted = true

//=================== prompting permission of media usage to user ===================//
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then((stream) => {
    addVideoStream(myVideo, stream)
    
    // Answering the call
    myPeer.on('call', (call)=>{
        call.answer(stream)
        // adding caller's stream on our page
        const video = document.createElement('video')
        call.on('stream', (callersStream) => {
            addVideoStream(video, callersStream)
        })
    })

    // sending our stream to new user/ calling to new user
    socket.on('user-joined', (userId) => {
        connectToNewUser(userId, stream)
    })
}).catch(error => {
    // alert message pop up
    console.log('Please allow web cam and voice', error);
}) 

// adding user's stream in myVideo element
const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play()
    })
    videoGrid.append(video)
}

//========================= Utils/ Custom Functions ======================================//
// sending our stream to new user
const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream)

    const video = document.createElement('video')
    // when we call user, the user send back their video stream
    call.on('stream', (userVideoStream) => {
        // we'll add it on our html page
        addVideoStream(video, userVideoStream)
    })

    call.on('close', ()=>{
        video.remove()
    })

    peers[userId] = call
}

const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}

//================= When peer object is created, user joins a room ==========================//
myPeer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id)
})

//======================= chat messages rendering ===============================//
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // $messageButton.disabled = true;
    const message = e.target.elements.messageInput.value
    socket.emit('sendMessage',  message);
    console.log(message);
})

socket.on('createMessage', ({userId, msg, createdAt}) => {
    const html = Mustache.render(messageTemplate, {
        userId: userId,
        createdAt: moment(createdAt).format('h: mm a'),
        message: msg
    })
    $messages.insertAdjacentHTML('beforeend', html);
    scrollToBottom()
})

//======================== Listening: User joined/left from server ===============================//
// temp messages on screen
socket.on('user-joined', (id) => {
    console.log('User joined: ' + id)
})

socket.on('user-disconnected', (userId) => {
    console.log('User left: ' + userId);
    if(peers[userId]) peers[userId].close()
})