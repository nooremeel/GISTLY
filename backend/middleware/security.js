// backend/middleware/security.js
const helmet = require('helmet');
const cors = require('cors');

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
};

// Custom mongo-injection sanitizer, Express 5-safe.
// express-mongo-sanitize reassigns req.query, which Express 5 blocks
// (req.query is getter-only), so we mutate objects in place instead.
function sanitizeInPlace(obj) {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === 'object') {
      sanitizeInPlace(obj[key]);
    }
  }
}

function mongoSanitize(req, res, next) {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.params);
  sanitizeInPlace(req.query); // mutated in place, never reassigned
  next();
}

function applySecurityMiddleware(app) {
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(mongoSanitize);
}

module.exports = applySecurityMiddleware;