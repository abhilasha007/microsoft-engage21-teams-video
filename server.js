const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {v4: uuidV4} = require('uuid')
const { ExpressPeerServer } = require('peer')
const { addUser } = require('./src/utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3030

const peerServer = ExpressPeerServer(server, {
    debug: true
})

app.set('view engine', 'ejs')
app.use(express.static('public'))
// app.use('/peerjs', peerServer)

// home page redirects to room page
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

// room page
app.get('/:room', (req, res) => {
    const roomId = req.params.room
    res.render('room', { roomId : roomId })
})

// when client connects
io.on('connection', (socket) => {
    console.log('New socket connection')

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        // addUser({userId, roomId})
        // console.log('Room id: ' + roomId + " user id: " + userId)
        socket.broadcast.to(roomId).emit('user-joined', userId)
        
        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    })

})

server.listen(port, () => {
    console.log(`Server started at ${port}`);
})