const boardService = require('./board.service.js');
const logger = require('../../services/logger.service')
const socketService = require('../../services/socket.service')

// GET LIST
async function getBoards(req, res) {
    try {
        var queryParams = req.query;
        const boards = await boardService.query(queryParams)
        res.json(boards);
    } catch (err) {
        logger.error('Failed to get boards', err)
        res.status(500).send({
            err: 'Failed to get boards'
        })
    }
}

// GET BY ID 
async function getBoardById(req, res) {
    try {
        const boardId = req.params._id;
        const board = await boardService.getById(boardId)
        console.log('boardID:::::: ', boardId)
        res.json(board)
    } catch (err) {
        logger.error('Failed to get board', err)
        res.status(500).send({
            err: 'Failed to get board'
        })
    }
}

// POST (add board)
async function addBoard(req, res) {
    try {
        const board = req.body;
        const addedBoard = await boardService.add(board)
        res.json(addedBoard)
    } catch (err) {
        logger.error('Failed to add board', err)
        res.status(500).send({
            err: 'Failed to add board'
        })
    }
}

// PUT (Update board)
async function updateBoard(req, res) {
    try {
        const board = req.body;
        var { user } = req.session;
        // logger.debug(req, 'ELIAS LOG')
        // console.log('got here', req);
        // console.log('USER ::::::', user)
        // console.log(user._id, board._id)
        if (!user) user = { _id: '624559a71ec4197167765f73' }
        const boardId = board._Id
        logger.debug('boardId: ', boardId, ' userId : ', user._id)
        const updatedBoard = await boardService.update(board)
            // console.log(updatedBoard);
        socketService.broadcast({
            type: 'board-changed',
            data: board,
            room: boardId,
            userId: user._id
        })
        res.json(updatedBoard)
    } catch (err) {
        logger.error('Failed to update board', err)
        res.status(500).send({
            err: 'Failed to update board'
        })
    }
}

// DELETE (Remove board)
async function removeBoard(req, res) {
    try {
        const boardId = req.params.id;
        const removedId = await boardService.remove(boardId)
        res.send(removedId)
    } catch (err) {
        logger.error('Failed to remove board', err)
        res.status(500).send({
            err: 'Failed to remove board'
        })
    }
}

module.exports = {
    getBoards,
    getBoardById,
    addBoard,
    updateBoard,
    removeBoard
}