const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy) {
    try {
        // const criteria = _buildCriteria(filterBy)
        // console.log('criteria:',criteria);
        const criteria = {}
        const sortBy = filterBy.sortBy || ''
            // console.log('sortBy',sortBy);
        const collection = await dbService.getCollection('board')
        var boards = await collection.find(criteria).toArray()
            // var boards = await collection.find(criteria).sort({
            //     [sortBy]: 1
            // }).toArray()
        return boards
    } catch (err) {
        logger.error('cannot find boards', err)
        throw err
    }
}

async function getById(boardId) {
    try {
        const collection = await dbService.getCollection('board')
        const board = collection.findOne({
            '_id': ObjectId(boardId)
        })
        return board
    } catch (err) {
        logger.error(`while finding board ${boardId}`, err)
        throw err
    }
}

async function remove(boardId) {
    try {
        const collection = await dbService.getCollection('board')
        await collection.deleteOne({
            '_id': ObjectId(boardId)
        })
        return boardId
    } catch (err) {
        logger.error(`cannot remove board ${boardId}`, err)
        throw err
    }
}

async function add(board) {
    try {
        const collection = await dbService.getCollection('board')
        const addedboard = await collection.insertOne(board)
        board._id = addedboard.insertedId
        return board
    } catch (err) {
        logger.error('cannot insert board', err)
        throw err
    }
}
async function update(board) {
    // console.log('board:', board);
    try {
        var id = ObjectId(board._id)
        delete board._id
        const collection = await dbService.getCollection('board')
        await collection.updateOne({
            "_id": id
        }, {
            $set: {
                ...board
            }
        })
        board._id = id
        return board
    } catch (err) {
        logger.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.name) {
        const nameCriteria = {
            $regex: filterBy.name,
            $options: 'i'
        }
        criteria.name = nameCriteria
    }

    if (filterBy.labels) criteria.labels = {
        $in: filterBy.labels
    };


    if (filterBy.inStock === 'true') {
        criteria.inStock = JSON.parse(filterBy.inStock)
    }
    if (filterBy.inStock === 'false') {
        criteria.inStock = JSON.parse(filterBy.inStock)
    }

    return criteria
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
}