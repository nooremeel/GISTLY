require('dotenv').config();

const validateEnv = require('../config/env');
try {
  validateEnv();
} catch (err) {
  console.error('Environment validation error:', err.message);
}

const connectDB = require('../config/db');
const app = require('../app');

module.exports = async (req, res) => {
  // Respond immediately to OPTIONS preflight without waiting for DB connection
  if (req.method === 'OPTIONS') {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB connection failure:', err.message);
  }

  return app(req, res);
};
