require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const applySecurityMiddleware = require('./middleware/security');
const { authLimiter, aiLimiter, passwordResetLimiter } = require('./middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateBookmarkUrl,
  validateForgotPassword,
  validateResetPassword,
} = require('./middleware/validateInput');
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

// Explicit route-level rate limiting and payload validation registered prior to subrouters.
app.post('/api/auth/login', authLimiter, validateLogin);
app.post('/api/auth/register', validateRegister);
app.post('/api/auth/forgot-password', passwordResetLimiter, validateForgotPassword);
app.post('/api/auth/reset-password/:token', validateResetPassword);
app.post('/api/bookmarks', aiLimiter, validateBookmarkUrl);


app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;