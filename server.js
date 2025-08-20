// === server.js (FINAL version) ===
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const expressSession = require('express-session')
const mongoose = require('mongoose')
const http = require('http')

const app = express()
const server = http.createServer(app)

// -- MongoDB Connection --
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB')
    seedGuestUser()
  })
  .catch(err => console.error('❌ MongoDB connection error:', err))

async function seedGuestUser () {
  const User = require('./api/user/user.model')
  const guest = await User.findOne({ username: 'guest' })
  if (!guest) {
    await User.create({
      username: 'guest',
      fullname: 'Guest User',
      password: '$2a$10$yqzajboiFpnZyOlsNVyq5uNEi8umPjCnHREmIr/BHDDWVsUm54W3i'
    })
    console.log('✅ Guest user created')
  }
}

// -- Middleware --
app.use(express.json())

// -- Session (needs to be declared BEFORE sockets) --
const session = expressSession({
  secret: process.env.SESSION_SECRET || 'coding_is_amazing',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
})
app.use(session)

// -- CORS --
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://tasko-front-end.onrender.com'
  ],
  credentials: true
}))

// -- Routes --
const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')
const boardRoutes = require('./api/board/board.routes')
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
const { connectSockets } = require('./services/socket.service')

app.all('*', setupAsyncLocalStorage)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/board', boardRoutes)

// -- Socket.io (pass the SAME “session” instance) --
connectSockets(server, session)

// -- SPA Fallback --
app.get('/**', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// -- Start Server --
const port = process.env.PORT || 3030
server.listen(port, () => {
  console.log('Server is running on port: ' + port)
})
// =============================
