const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
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
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Custom validation: at least one of `url` or `note` must be present
bookmarkSchema.pre('validate', function (next) {
  if (!this.url && !this.note) {
    this.invalidate('url', 'Either a URL or a note is required.');
  }
});

// Compound indexes for user queries, sorting, and aggregations
bookmarkSchema.index({ user: 1, createdAt: -1 });
bookmarkSchema.index({ user: 1, collection: 1 });
bookmarkSchema.index({ user: 1, tags: 1 });

// Compound text index supporting full-text search across content fields.
bookmarkSchema.index(
  { title: 'text', note: 'text', url: 'text', tags: 'text' },
  { name: 'bookmark_text_search' }
);

module.exports = mongoose.model('Bookmark', bookmarkSchema);