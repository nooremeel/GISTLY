const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../services/emailService');

const SALT_ROUNDS = 10;

async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, password: hashedPassword });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    return res.status(201).json({ id: user._id, email: user.email, profilePicture: user.profilePicture });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ message: 'Server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    return res.status(200).json({ id: user._id, email: user.email, profilePicture: user.profilePicture });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
}

function logout(req, res) {
  clearTokenCookie(res);
  return res.status(200).json({ message: 'Logged out successfully' });
}

async function getMe(req, res) {
  return res.status(200).json({ id: req.user._id, email: req.user.email, profilePicture: req.user.profilePicture });
}

async function updateMe(req, res) {
  try {
    const { profilePicture } = req.body;
    const user = await User.findById(req.user._id);
    
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }
    
    await user.save();
    return res.status(200).json({ id: user._id, email: user.email, profilePicture: user.profilePicture });
  } catch (err) {
    console.error('Update me error:', err.message);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return identical success response to mitigate account enumeration attacks.
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientOrigin = (process.env.CLIENT_ORIGIN || '').split(',')[0].trim() || req.headers.origin || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    try {
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });

      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        ...(process.env.NODE_ENV !== 'production' ? { previewUrl: emailResult.previewUrl, resetUrl } : {}),
      });
    } catch (mailErr) {
      console.error('Email send failed:', mailErr.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Could not send reset email' });
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during password reset request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Establish authenticated session immediately following credential rotation.
    const authToken = generateToken(user._id);
    setTokenCookie(res, authToken);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      id: user._id,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
}

module.exports = { register, login, logout, getMe, updateMe, forgotPassword, resetPassword };