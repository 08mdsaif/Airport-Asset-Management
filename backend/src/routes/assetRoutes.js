const express = require('express');
const {
  getAssets,
  getAsset,
  lookupAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset,
  regenerateQRCode,
  getAssetAISummary,
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/', getAssets);
router.get('/lookup/:code', lookupAssetByCode); // used by QR scanner
router.get('/:id', getAsset);
router.get('/:id/ai-summary', getAssetAISummary);
router.post('/', authorize('admin', 'supervisor'), upload.single('image'), createAsset);
router.put('/:id', authorize('admin', 'supervisor'), upload.single('image'), updateAsset);
router.post('/:id/qrcode', authorize('admin', 'supervisor'), regenerateQRCode);
router.delete('/:id', authorize('admin'), deleteAsset);

module.exports = router;
