const rateLimit = require('express-rate-limit');

// Throttles brute-force credential attacks while allowing unimpeded authenticated sessions.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

// Protects upstream Gemini API quota and prevents abusive scraping workloads.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many bookmark creations, please slow down' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests, please try again later' },
});

module.exports = { authLimiter, aiLimiter, passwordResetLimiter };