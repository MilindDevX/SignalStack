const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {errorHandler} = require('./middlewares/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const teamsRouter = require('./routes/teams');
const channelsRouter = require('./routes/channels');
const messageRouter = require('./routes/messages');
const usersRouter = require('./routes/users');
const analyticsRouter = require('./routes/analytics');
const notificationsRouter = require('./routes/notifications');
const decisionsRouter = require('./routes/decisions');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/channels', channelsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/messages', messageRouter);
app.use('/api/users', usersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/decisions', decisionsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
