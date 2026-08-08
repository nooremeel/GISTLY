require('dotenv').config();
const validateEnv = require('./config/env');
validateEnv();

const express = require('express');
const connectDB = require('./config/db');
const morgan = require('morgan');
const applySecurityMiddleware = require('./middleware/security');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
applySecurityMiddleware(app);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});