const mongoose = require('mongoose');

const Bookmark = require('../models/Bookmark');
const { generateSummaryAndTags } = require('../services/aiService');

const toTitleCase = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// @desc    Create a bookmark
// @route   POST /api/bookmarks
const createBookmark = async (req, res) => {
  try {
    const { title, url, note, tags: userTags = [], collection, imageUrl } = req.body;
    const { summary, tags: aiTags, fetchedTitle, fetchedImage } = await generateSummaryAndTags({ url, note, userTags });
    const mergedTags = [...userTags, ...aiTags]
      .map((t) => t.trim())
      .filter(Boolean)
      .map(toTitleCase)
      .filter((t, i, arr) => arr.indexOf(t) === i);
      
    const finalTitle = title || fetchedTitle || '';
    const finalImageUrl = imageUrl || fetchedImage || '';
    
    const bookmark = await Bookmark.create({
      user: req.user.id,
      title: finalTitle,
      url,
      note,
      collection,
      imageUrl: finalImageUrl,
      summary,
      tags: mergedTags,
    });

    res.status(201).json(bookmark);
  } catch (err) {

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('createBookmark error:', err);
    res.status(500).json({ message: 'Server error creating bookmark' });
  }
};

// @desc    Get paginated bookmarks for the logged-in user
// @route   GET /api/bookmarks?page=&limit=&search=
const getBookmarks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { note: searchRegex },
        { url: searchRegex },
        { tags: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      Bookmark.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bookmark.countDocuments(filter),
    ]);

    res.status(200).json({
      data,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching bookmarks' });
  }
};

// @desc    Get a single bookmark (owner only)
// @route   GET /api/bookmarks/:id
const getBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.status(200).json(bookmark);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    res.status(500).json({ message: 'Server error fetching bookmark' });
  }
};

// @desc    Update a bookmark (owner only)
// @route   PUT /api/bookmarks/:id
const updateBookmark = async (req, res) => {
  try {
    const { title, url, note, tags, collection, imageUrl } = req.body;

    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    if (title !== undefined) bookmark.title = title;
    if (url !== undefined) bookmark.url = url;
    if (note !== undefined) bookmark.note = note;
    if (tags !== undefined) {
      bookmark.tags = tags
        .map((t) => t.trim())
        .filter(Boolean)
        .map(toTitleCase)
        .filter((t, i, arr) => arr.indexOf(t) === i);
    }
    if (collection !== undefined) bookmark.collection = collection;
    if (imageUrl !== undefined) bookmark.imageUrl = imageUrl;

    await bookmark.save(); // triggers pre('validate') hook

    res.status(200).json(bookmark);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    res.status(500).json({ message: 'Server error updating bookmark' });
  }
};

// @desc    Delete a bookmark (owner only)
// @route   DELETE /api/bookmarks/:id
const deleteBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.status(200).json({ message: 'Bookmark deleted', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    res.status(500).json({ message: 'Server error deleting bookmark' });
  }
};

// GET /api/bookmarks/grouped — bookmarks grouped by collection/folder
const getGrouped = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const grouped = await Bookmark.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$collection',
          count: { $sum: 1 },
          bookmarks: { $push: '$$ROOT' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ data: grouped });
  } catch (err) {
    console.error('getGrouped error:', err);
    res.status(500).json({ message: 'Server error while grouping bookmarks' });
  }
};

// GET /api/bookmarks/tags/:tag — bookmarks matching a single tag (scoped to user)
const getByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = await Bookmark.find({
      user: req.user.id,
      tags: { $regex: new RegExp(`^${escapedTag}$`, 'i') }
    }).sort({ createdAt: -1 });

    res.status(200).json({ data: results });
  } catch (err) {
    console.error('getByTag error:', err);
    res.status(500).json({ message: 'Server error while fetching bookmarks by tag' });
  }
};

// GET /api/bookmarks/tags — all tags grouped and counted
const getTags = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const tags = await Bookmark.aggregate([
      { $match: { user: userId } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]);
    res.status(200).json({ data: tags });
  } catch (err) {
    console.error('getTags error:', err);
    res.status(500).json({ message: 'Server error while fetching tags' });
  }
};

// GET /api/bookmarks/collections — all collections grouped and counted
const getCollections = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const collections = await Bookmark.aggregate([
      { $match: { user: userId, collection: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$collection',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]);
    res.status(200).json({ data: collections });
  } catch (err) {
    console.error('getCollections error:', err);
    res.status(500).json({ message: 'Server error while fetching collections' });
  }
};

module.exports = {
  createBookmark,
  getBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  getGrouped,
  getByTag,
  getTags,
  getCollections,
};