const express = require('express');
const {
  exportMaintenanceReportPDF,
  exportComplaintReportPDF,
  exportAssetReportPDF,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/maintenance-pdf', authorize('admin', 'supervisor'), exportMaintenanceReportPDF);
router.get('/complaints-pdf', authorize('admin', 'supervisor'), exportComplaintReportPDF);
router.get('/asset-pdf/:id', exportAssetReportPDF);

module.exports = router;
