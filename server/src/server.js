const express = require('express')
const app = express()
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
const {harperSaveMessage, harperGetMessages} = require('./services/harper')
require('dotenv').config();
const leaveRoom = require("./utils/leave-room")

app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})
const CHAT_BOT = 'ChatBot';
let chatRoom = '';
let allUsers = [];
let chatRoomUsers = [];

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on('join_room', async (data) => {
        const {userName, room} = data;
        socket.join(room);

        let __createdtime__ = Date.now();

        socket.to(room).emit('receive_message', {
            message: `${userName} has join the chat room`,
            userName: CHAT_BOT,
            __createdtime__
        })
        socket.emit('receive_message', {
            message: `Welcome ${userName}`,
            userName: CHAT_BOT,
            __createdtime__
        })
        chatRoom = room;
        allUsers.push({id: socket.id, userName, room});
        chatRoomUsers = allUsers.filter((user) => {
            return user.room === room
        })
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);
        const res = await harperGetMessages(room);
        socket.emit('last_100_messages', res.data);
    })
    socket.on('send_message', async (data) => {
        const {message, userName, room, __createdtime__} = data;
        io.in(room).emit('receive_message', data);
        console.log(message);
        const response = await harperSaveMessage(message, userName, room, __createdtime__);
        console.log(response.data)
    })
    socket.on('leave_room', (data) => {
        const {userName, room} = data;
        socket.leave(room);
        const __createdtime__ = Date.now();
        allUsers = leaveRoom(socket.id, allUsers);
        socket.to(room).emit('chatroom_users', allUsers)
        socket.to(room).emit('receive_message', {
            userName: CHAT_BOT,
            message: `${userName} has left the chat`,
            __createdtime__
        })
        console.log(`${userName} has left the chat`)
    })
    socket.on('disconnect', () => {
        console.log('User disconnected from the chat')
        const user = allUsers.find((user) => user.id === socket.id)
        if(user?.userName){
            allUsers = leaveRoom(socket.id, allUsers);
            socket.to(chatRoom).emit('chatroom_users', allUsers);
            socket.to(chatRoom).emit('receive_message', {
                message: `${user.userName} has disconnected from the chat`
            })
        }
    })
})

app.get('/', (req, res) => {
    res.send('Hello world!')
})

server.listen(4000, () => {
    console.log('Server is running on port 4000')
})

