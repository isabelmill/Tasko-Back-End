const fs = require('fs')
const asyncLocalStorage = require('./als.service')


const logsDir = './logs'
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

//define the time format
function getTime() {
    let now = new Date()
    return now.toLocaleString()
}


function isError(e) {
    return e && e.stack && e.message;
}

function doLog(level, ...args) {

    // console.log('LOGGER:', args);
    const strs = args.map(arg =>
        (typeof arg === 'string' || isError(arg)) ? arg : JSON.stringify(arg)
    )

    //changed here because VS doesnt like - const sessionId = store?.sessionId

    var line = strs.join(' | ')
    const store = asyncLocalStorage.getStore()
    const sessionId = store ? store.sessionId : ''
    const sid = sessionId ? `(sid: ${sessionId})` : ''
    line = `${getTime()} - ${level} - ${line} ${sid}\n`
    fs.appendFileSync('./logs/backend.log', line)
}

module.exports = {
    debug(...args) {
        if (process.env.NODE_NEV === 'production') return
        doLog('DEBUG', ...args)
    },
    info(...args) {
        doLog('INFO', ...args)
    },
    warn(...args) {
        doLog('WARN', ...args)
    },
    error(...args) {
        doLog('ERROR', ...args)
    }
}