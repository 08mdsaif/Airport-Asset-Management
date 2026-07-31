const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');
const logActivity = require('../utils/logActivity');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .populate('head', 'name email designation')
    .sort('name');
  res.json({ success: true, data: departments });
});

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('head', 'name email designation');
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  res.json({ success: true, data: department });
});

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, location, head } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error('Name and code are required');
  }

  const department = await Department.create({ name, code, description, location, head });

  await logActivity({
    user: req.user._id,
    action: 'CREATE_DEPARTMENT',
    module: 'department',
    targetId: department._id,
    req,
  });

  res.status(201).json({ success: true, data: department });
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'code', 'description', 'location', 'head', 'isActive'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const department = await Department.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  await logActivity({
    user: req.user._id,
    action: 'UPDATE_DEPARTMENT',
    module: 'department',
    targetId: department._id,
    req,
  });

  res.json({ success: true, data: department });
});

// @desc    Delete (deactivate) department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  await logActivity({
    user: req.user._id,
    action: 'DEACTIVATE_DEPARTMENT',
    module: 'department',
    targetId: department._id,
    req,
  });

  res.json({ success: true, message: 'Department deactivated' });
});

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
