const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// The department list is intentionally public (no `protect`) because the
// Register page needs it to populate the "Department" dropdown *before* a
// new employee has a JWT. Names/codes aren't sensitive information.
router.get('/', getDepartments);

router.get('/:id', protect, getDepartment);
router.post('/', protect, authorize('admin'), createDepartment);
router.put('/:id', protect, authorize('admin'), updateDepartment);
router.delete('/:id', protect, authorize('admin'), deleteDepartment);

module.exports = router;
