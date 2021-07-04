const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {v4: uuidV4} = require('uuid')

const { addUser, getUserById } = require('./src/utils/users')
const { generateMessage } = require('./src/utils/messages')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000


app.use(express.json())
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    const roomId = req.params.room
    res.render('room', { roomId : roomId })
})

// when client connects
io.on('connection', (socket) => {
    console.log('New socket connection')

    socket.on('join-room', (roomId, userId, username) => {
        console.log(roomId, userId, username);
        const {user} = addUser({userId: userId, roomId: roomId, username: username})
        socket.join(user.roomId)
        
        socket.broadcast.to(roomId).emit('user-joined', userId)
        
        // recieving message from client
        socket.on('sendMessage', (msg, callback) => {
            //---profanity filter for later---//
            socket.broadcast.to(user.roomId).emit('createMessage', generateMessage(userId, msg, username));
            callback()
        })

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    })
})

server.listen(port, () => {
    console.log(`Server started at ${port}`);
})