const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {v4: uuidV4} = require('uuid')

const { addUser, getUserById, removeUser, getUsersInRoom } = require('./src/utils/users')
const { generateMessage } = require('./src/utils/messages')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('home');
})

app.post('/', (req, res) => {
    if(!req.body.room_code) {
        res.redirect(`/${uuidV4()}`);
    }
    else {
        const roomId = req.body.room_code;
        res.redirect(`/${roomId}`);
    }
})

app.get('/:room', (req, res) => {
    const roomId = req.params.room
    res.render('joinroom', {roomId: roomId});
})

app.post('/:room', (req, res) => {
    if(req.body.left) {
        res.render('leftpage', {roomId: req.body.roomId, username: req.body.username});
    }
    else {
        const roomId = req.body.roomId;
        const username = req.body.username;
        const roomname = req.body.roomname;
        res.render('room', {roomId : roomId, username: username, roomname: roomname})
    }
})

// when client connects
io.on('connection', (socket) => {
    console.log('New socket connection')

    socket.on('join-room', (roomId, userId, username) => {
        const {user} = addUser({userId: userId, socketId: socket.id, roomId: roomId, username: username})
        socket.join(user.roomId)
        
        socket.broadcast.to(roomId).emit('user-joined', userId, username)
        
        io.to(roomId).emit('roomData', {
            users: getUsersInRoom(roomId)
        })

        // recieving message from client
        socket.on('sendMessage', (msg, callback) => {
            socket.broadcast.to(user.roomId).emit('createMessage', generateMessage(msg, username));
            callback()
        })

        socket.on('raise-hand', () => {
            io.to(user.roomId).emit('handRaised', username);
        })

        socket.on('disconnect', () => {
            const user = removeUser(socket.id)
            socket.broadcast.to(roomId).emit('user-disconnected', userId, username);
            io.to(roomId).emit('roomData', {
                users: getUsersInRoom(user.roomId)
            })
        })
    })
})

server.listen(port, () => {
    console.log(`Server started at ${port}`);
})