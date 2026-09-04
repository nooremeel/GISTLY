require('dotenv').config();

const validateEnv = require('../config/env');
validateEnv();

const connectDB = require('../config/db');
const app = require('../app');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('Serverless DB connection failure:', err);
    return res.status(500).json({ message: 'Database connection failed' });
  }
};
