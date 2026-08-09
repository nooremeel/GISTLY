const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      trim: true,
    },
    collection: {
      type: String,
      trim: true,
      default: 'Uncategorized',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Custom validation: at least one of `url` or `note` must be present
bookmarkSchema.pre('validate', function (next) {
  if (!this.url && !this.note) {
    this.invalidate('url', 'Either a URL or a note is required.');
  }
  next();
});

// Compound index to support Task 09's tag/folder aggregation queries
bookmarkSchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);