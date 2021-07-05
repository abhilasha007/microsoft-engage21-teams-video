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

app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('home');
})

app.post('/', (req, res) => {
    console.log(req.body);
    res.render('joinroom', {roomId: req.body.room_code});
})

app.get('/creds', (req, res) => {
    res.render('createroom', {
        roomId: uuidV4()
    });
})

app.post('/callended', (req, res) => {
    console.log('Left page', req.body);
    res.render('leftpage', {roomId: req.body.roomId, username: req.body.username});
})

app.get('/:room', (req, res) => {
    const roomId = req.params.room
    res.render('room', { roomId : roomId })
})

app.post('/:room', (req, res) => {
    console.log(req.body);
    const username = req.body.username;
    const roomname = req.body.roomname;
    const roomId = req.body.roomId;
    res.render('room', {roomId : roomId, username: username, roomname: roomname})
})

// when client connects
io.on('connection', (socket) => {
    console.log('New socket connection')

    socket.on('join-room', (roomId, userId, username) => {
        const {user} = addUser({userId: userId, socketId: socket.id, roomId: roomId, username: username})
        socket.join(user.roomId)
        
        socket.broadcast.to(roomId).emit('user-joined', userId)
        
        // recieving message from client
        socket.on('sendMessage', (msg, callback) => {
            socket.broadcast.to(user.roomId).emit('createMessage', generateMessage(msg, username));
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