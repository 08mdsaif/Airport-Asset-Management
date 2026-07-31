const express = require('express');
const {
  getMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMaintenanceRecords);
router.get('/:id', getMaintenanceRecord);
router.post('/', authorize('admin', 'supervisor'), createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord); // employees can update tasks assigned to them (status/remarks)
router.delete('/:id', authorize('admin', 'supervisor'), deleteMaintenanceRecord);

module.exports = router;
