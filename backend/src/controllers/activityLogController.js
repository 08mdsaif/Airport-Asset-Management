const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs (audit trail)
// @route   GET /api/activity-logs
// @access  Private/Admin
const getActivityLogs = asyncHandler(async (req, res) => {
  const { user, module, from, to, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (module) filter.module = module;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const logs = await ActivityLog.find(filter)
    .populate('user', 'name email role')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await ActivityLog.countDocuments(filter);
  res.json({ success: true, data: logs, pagination: { total, page: Number(page), limit: Number(limit) } });
});

module.exports = { getActivityLogs };
