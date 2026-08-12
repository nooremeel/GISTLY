const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { email, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  next();
}

function validateBookmarkUrl(req, res, next) {
  const { url } = req.body;

  if (url === undefined || url === null || url === '') {
    return next();
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid URL format' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ success: false, message: 'URL must use http or https' });
  }

  next();
}

module.exports = { validateRegister, validateLogin, validateBookmarkUrl };