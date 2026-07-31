const express = require('express');
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admins AND supervisors need to read the staff list to populate "Assign To"
// dropdowns on Complaints, Maintenance, and Assets - so reads are open to both.
router.get('/', authorize('admin', 'supervisor'), getUsers);
router.get('/:id', authorize('admin', 'supervisor'), getUser);

// Only admins can actually change roles, deactivate accounts, etc.
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
