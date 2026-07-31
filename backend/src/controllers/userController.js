const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');

// @desc    Get all users (with optional filters)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { role, department, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const users = await User.find(filter)
    .populate('department', 'name code')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await User.countDocuments(filter);

  res.json({ success: true, data: users, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('department', 'name code');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @desc    Update a user (role, department, active status, etc.)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'role', 'department', 'designation', 'phone', 'isActive'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await logActivity({ user: req.user._id, action: 'UPDATE_USER', module: 'user', targetId: user._id, req });

  res.json({ success: true, data: user });
});

// @desc    Delete (deactivate) a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await logActivity({ user: req.user._id, action: 'DEACTIVATE_USER', module: 'user', targetId: user._id, req });

  res.json({ success: true, message: 'User deactivated', data: user });
});

module.exports = { getUsers, getUser, updateUser, deleteUser };
