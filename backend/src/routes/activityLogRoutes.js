const express = require('express');
const { getActivityLogs } = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getActivityLogs);

module.exports = router;
