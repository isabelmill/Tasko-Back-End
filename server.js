require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const expressSession = require('express-session');
const mongoose = require('mongoose');
const http = require('http');

const app = express();
const server = http.createServer(app);

// --- MongoDB Connection ---
const mongoUri = process.env.MONGO_URI;
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB')
    seedGuestUser()
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Seed guest user if not present ---
async function seedGuestUser() {
  try {
    const User = require('./api/user/user.model')
    const guest = await User.findOne({ username: 'guest' })
    if (!guest) {
      await User.create({
        username: 'guest',
        fullname: 'Guest User',
        // bcrypt hash for password: guest123
        password: '$2a$10$yqzajboiFpnZyOlsNVyq5uNEi8umPjCnHREmIr/BHDDWVsUm54W3i'
      })
      console.log('✅ Guest user created!')
    } else {
      console.log('ℹ️  Guest user already exists, skipping seed')
    }
  } catch (err) {
    console.error('❌ Failed to seed guest user:', err)
  }
}

// --- Middleware ---
app.use(express.json());

// --- Session config (must come BEFORE connectSockets)
const session = expressSession({
  secret: process.env.SESSION_SECRET || 'coding_is_amazing',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
  }
})
app.use(session)

// --- CORS setup ---
const corsOptions = {
  origin: [
    'http://127.0.0.1:8080',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'https://tasko-front-end.onrender.com'
  ],
  credentials: true
}
app.use(cors(corsOptions));

// --- Routes ---
const authRoutes = require('./api/auth/auth.routes');
const userRoutes = require('./api/user/user.routes');
const boardRoutes = require('./api/board/board.routes');

const { connectSockets } = require('./services/socket.service');
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware');

app.all('*', setupAsyncLocalStorage);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/board', boardRoutes);

// --- Socket setup (AFTER session is defined)
connectSockets(server, session);

// --- SPA fallback ---
app.get('/**', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Logger ---
const logger = require('./services/logger.service');

// --- Start Server ---
const port = process.env.PORT || 3030;
server.listen(port, () => {
  logger.info(`Server is running on port: ${port}`);
});
