const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBookmark,
  getBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  getGrouped,
  getByTag,
  getTags
} = require('../controllers/bookmarkController');

router.use(protect); // every route below requires a valid session

router.route('/')
  .get(getBookmarks)
  .post(createBookmark);

router.get('/grouped', getGrouped);
router.get('/tags', getTags);
router.get('/tags/:tag', getByTag);

router.route('/:id')
  .get(getBookmark)
  .put(updateBookmark)
  .delete(deleteBookmark);


module.exports = router;