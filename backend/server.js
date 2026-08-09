require('dotenv').config();
const validateEnv = require('./config/env');
validateEnv();

const express = require('express');
const connectDB = require('./config/db');
const morgan = require('morgan');
const applySecurityMiddleware = require('./middleware/security');
const app = express();
const cookieParser = require('cookie-parser');


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

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});