require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const applySecurityMiddleware = require('./middleware/security');
const { authLimiter, aiLimiter } = require('./middleware/rateLimiter');
const { validateRegister, validateLogin, validateBookmarkUrl } = require('./middleware/validateInput');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(cookieParser());
applySecurityMiddleware(app);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// Exact-path validation/rate-limiting, registered before router mounts
app.post('/api/auth/login', authLimiter, validateLogin);
app.post('/api/auth/register', validateRegister);
app.post('/api/bookmarks', aiLimiter, validateBookmarkUrl);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;