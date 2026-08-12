require('dotenv').config();
const validateEnv = require('./config/env');
validateEnv();

const express = require('express');
const connectDB = require('./config/db');
const morgan = require('morgan');
const applySecurityMiddleware = require('./middleware/security');
const app = express();
const cookieParser = require('cookie-parser');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { validateRegister, validateLogin, validateBookmarkUrl } = require('./middleware/validateInput');
const { authLimiter, aiLimiter } = require('./middleware/rateLimiter');


const authRoutes = require('./routes/auth');

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

app.use(cookieParser());


applySecurityMiddleware(app);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

app.post('/api/auth/register', validateRegister);
app.post('/api/auth/login', authLimiter, validateLogin);

app.use('/api/auth', authRoutes);

app.post('/api/bookmarks', aiLimiter, validateBookmarkUrl);
app.use('/api/bookmarks', require('./routes/bookmarks'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});