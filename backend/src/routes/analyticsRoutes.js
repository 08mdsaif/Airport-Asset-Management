const express = require('express');
const {
  assetsByDepartment,
  pendingMaintenance,
  criticalAssets,
  monthlyRepairCost,
  assetUtilization,
  complaintTrends,
  summary,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/summary', summary);
router.get('/assets-by-department', assetsByDepartment);
router.get('/pending-maintenance', pendingMaintenance);
router.get('/critical-assets', criticalAssets);
router.get('/monthly-repair-cost', monthlyRepairCost);
router.get('/asset-utilization', assetUtilization);
router.get('/complaint-trends', complaintTrends);

module.exports = router;
