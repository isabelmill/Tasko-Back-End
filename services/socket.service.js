const { emit } = require('process');
const asyncLocalStorage = require('./als.service');
const logger = require('./logger.service');

var gIo = null

function connectSockets(http, session) {
   gIo = require('socket.io')(http, {
    cors: {
        origin: 'https://YOUR_FRONTEND.onrender.com',  // 👈 your frontend URL
        methods: ['GET', 'POST']
    }
})
    gIo.on('connection', socket => {
        socket.on('disconnect', socket => {
            console.log('Someone disconnected')
        })
        socket.on('watch board', boardId => {
                if (socket.boardId === boardId) return;
                if (socket.boardId) {
                    socket.leave(socket.boardId)
                }
                socket.join(boardId)
                socket.boardId = boardId
            })
        socket.on('user-watch', userId => {
            socket.join('watching:' + userId)
        })
        socket.on('set-user-socket', userId => {
            logger.debug(`Setting (${socket.id}) socket.userId = ${userId}`)
            socket.userId = userId
            emitTo({ type: 'connected', data: userId })
        })
        socket.on('unset-user-socket', () => {
            delete socket.userId
        })

    })
}

function emitTo({ type, data, room }) {
    if (room) gIo.to(room).emit(type, data)
    else gIo.emit(type, data)
}
// function emitTo({ type, data, label }) {
//     if (label) gIo.to('watching:' + label).emit(type, data)
//     else gIo.emit(type, data)
// }

async function emitToUser({ type, data, userId }) {
    logger.debug('Emiting to user socket: ' + userId)
    const socket = await _getUserSocket(userId)
    if (socket) socket.emit(type, data)
    else {
        console.log('User socket not found');
        _printSockets();
    }
}

// Send to all sockets BUT not the current socket 
async function broadcast({ type, data, room = null, userId }) {
    // console.log('BROADCASTING', JSON.stringify(arguments));
    const excludedSocket = await _getUserSocket(userId)
    if (!excludedSocket) {
        logger.debug(`Shouldnt happen, socket not found ${ userId }`)
        _printSockets();
        return;
    }
    logger.debug('broadcast to all but user: ', userId)
        // logger.debug(room, '!!!')
    if (room) {
        logger.debug('room: ', room, ' type: ', type, ' userId: ', userId)
        const clients = gIo.sockets.adapter.rooms.get('624211bd8517eaf0178ee3f1')
        excludedSocket.broadcast.to(room).emit(type, data)
    } else {
        excludedSocket.broadcast.emit(type, data)
    }
}

async function _getUserSocket(userId) {
    const sockets = await _getAllSockets();
    const socket = sockets.find(s => {
        console.log(s.userId, userId);
        return s.userId === userId
    })
    return socket;
}
async function _getAllSockets() {
    // return all Socket instances
    const sockets = await gIo.fetchSockets();
    return sockets;
}

async function _printSockets() {
    const sockets = await _getAllSockets()
    console.log(`
                Sockets: (count: $ { sockets.length }): `)
    sockets.forEach(_printSocket)
}

function _printSocket(socket) {
    console.log(`
                Socket - socketId: $ { socket.id }
                userId: $ { socket.userId }
                `)
}

module.exports = {
    connectSockets,
    emitTo,
    emitToUser,
    broadcast,
}