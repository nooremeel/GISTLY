const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const Upload = require('../models/Upload');

// Store files in memory so they can be saved directly to MongoDB
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload route: stores in MongoDB Atlas, returns persistent URL
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${req.file.fieldname || 'image'}-${uniqueSuffix}${ext}`;

    await Upload.create({
      filename,
      originalName: req.file.originalname,
      contentType: req.file.mimetype || 'image/jpeg',
      size: req.file.size,
      data: req.file.buffer,
      user: req.user._id,
    });

    const imageUrl = `/uploads/${filename}`;
    return res.status(200).json({ url: imageUrl, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Serve image route: GET /:filename
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // 1. Check MongoDB
    const fileDoc = await Upload.findOne({ filename });
    if (fileDoc && fileDoc.data) {
      res.set('Content-Type', fileDoc.contentType);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(fileDoc.data);
    }

    // 2. Fallback to local disk if legacy file exists
    const diskPath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }

    return res.status(404).json({ message: 'Image not found' });
  } catch (err) {
    console.error('Serve image error:', err);
    return res.status(500).json({ message: 'Failed to retrieve image' });
  }
});

module.exports = router;
