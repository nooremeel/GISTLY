const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');

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

    return res.status(201).json({ id: user._id, email: user.email });
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

    return res.status(200).json({ id: user._id, email: user.email });
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
  // req.user is set by the auth middleware
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

module.exports = { register, login, logout, getMe, updateMe };