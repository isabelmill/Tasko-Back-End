const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const { getBoards, getBoardById, addBoard, updateBoard, removeBoard, } = require('./board.controller')
const router = express.Router()


router.get('/', getBoards)
router.get('/:_id', getBoardById)
router.post('/', addBoard)
router.put('/:_id', updateBoard)
router.delete('/:_id', removeBoard)

module.exports = router