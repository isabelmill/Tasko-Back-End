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
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Middleware ---
app.use(express.json());

// Session config
const session = expressSession({
  secret: process.env.SESSION_SECRET || 'coding_is_amazing',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // needed for cross-origin cookies
    httpOnly: true,
  }
});
app.use(session);

// CORS setup

  const corsOptions = {
    origin: [
      'http://127.0.0.1:8080',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'https://tasko-front-end.onrender.com'
    ],
    credentials: true
  };
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

// --- Socket setup ---
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
