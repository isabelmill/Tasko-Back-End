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
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tasko_db';
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
  cookie: { secure: process.env.NODE_ENV === 'production' }
});
app.use(session);

// CORS setup
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'public')));
} else {
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
}

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
