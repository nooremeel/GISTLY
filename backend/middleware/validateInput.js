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
  // url is optional — a bookmark can be a note-only entry.
  if (req.body.url === undefined || req.body.url === null || req.body.url === '') {
    return next();
  }

  // Normalise the URL in-place on req.body so the controller always
  // receives a fully-qualified URL (was a const-reassignment bug).
  if (!/^https?:\/\//i.test(req.body.url)) {
    req.body.url = 'https://' + req.body.url;
  }

  let parsed;
  try {
    parsed = new URL(req.body.url);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid URL format' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ success: false, message: 'URL must use http or https' });
  }

  next();
}

function validateForgotPassword(req, res, next) {

  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required' });
  }
  next();
}

function validateResetPassword(req, res, next) {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateBookmarkUrl,
  validateForgotPassword,
  validateResetPassword,
};