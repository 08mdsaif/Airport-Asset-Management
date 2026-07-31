const express = require('express');
const {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  reanalyzeComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.post('/', upload.array('attachments', 5), createComplaint);
router.put('/:id', authorize('admin', 'supervisor'), updateComplaint);
router.post('/:id/reanalyze', authorize('admin', 'supervisor'), reanalyzeComplaint);
router.delete('/:id', authorize('admin'), deleteComplaint);

module.exports = router;
