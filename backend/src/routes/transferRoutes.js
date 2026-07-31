const express = require('express');
const { getTransfers, createTransfer, updateTransfer } = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTransfers);
router.post('/', authorize('admin', 'supervisor'), createTransfer);
router.put('/:id', authorize('admin'), updateTransfer);

module.exports = router;
