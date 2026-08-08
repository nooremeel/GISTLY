// backend/config/env.js
const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variable(s): ${missing.join(', ')}\n` +
      `   Check your backend/.env file against .env.example and try again.`
    );
    process.exit(1);
  }
}

module.exports = validateEnv; 