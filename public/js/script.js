const socket = io('/')
const videoGrid = document.getElementById("video-grid");

var myPeer = new Peer()
const peers = {}

myPeer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id)
})

socket.on('user-joined', (id) => {
    console.log('User joined: ' + id)
})

socket.on('user-disconnected', userId => {
    if(peers[userId]) peers[userId].close()
})

const myVideo = document.createElement('video')
myVideo.muted = true

// prompting permission of media usage to user
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
})

// functions
// adding user's stream in myVideo element
const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play()
    })
    videoGrid.append(video)
}

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