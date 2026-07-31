const asyncHandler = require('express-async-handler');
const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
const Complaint = require('../models/Complaint');
const { predictMaintenancePriority } = require('../services/geminiService');
const { sendNotification, notifyAdmins } = require('../services/notificationService');
const logActivity = require('../utils/logActivity');

// @desc    Get maintenance records (filterable)
// @route   GET /api/maintenance
// @access  Private
const getMaintenanceRecords = asyncHandler(async (req, res) => {
  const { asset, status, priority, type, assignedTo, from, to, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (asset) filter.asset = asset;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (from || to) {
    filter.scheduledDate = {};
    if (from) filter.scheduledDate.$gte = new Date(from);
    if (to) filter.scheduledDate.$lte = new Date(to);
  }

  // Employees see only maintenance tasks assigned to them
  if (req.user.role === 'employee') filter.assignedTo = req.user._id;

  const records = await Maintenance.find(filter)
    .populate('asset', 'name assetId category department')
    .populate('assignedTo', 'name email')
    .populate('linkedComplaint', 'complaintId title')
    .sort('scheduledDate')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Maintenance.countDocuments(filter);

  res.json({ success: true, data: records, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
// @access  Private
const getMaintenanceRecord = asyncHandler(async (req, res) => {
  const record = await Maintenance.findById(req.params.id)
    .populate('asset')
    .populate('assignedTo', 'name email')
    .populate('linkedComplaint', 'complaintId title description');
  if (!record) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }
  res.json({ success: true, data: record });
});

// @desc    Create/schedule a maintenance task - runs AI priority prediction
// @route   POST /api/maintenance
// @access  Private/Admin/Supervisor
const createMaintenanceRecord = asyncHandler(async (req, res) => {
  const { asset, type, title, description, scheduledDate, assignedTo, linkedComplaint } = req.body;

  if (!asset || !title || !scheduledDate) {
    res.status(400);
    throw new Error('Asset, title, and scheduledDate are required');
  }

  const assetDoc = await Asset.findById(asset);
  if (!assetDoc) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const record = await Maintenance.create({
    asset,
    type,
    title,
    description,
    scheduledDate,
    assignedTo: assignedTo || undefined, // '' (Unassigned) can't be cast to an ObjectId
    linkedComplaint: linkedComplaint || undefined,
    createdBy: req.user._id,
  });

  // --- AI: Predict maintenance priority ---
  try {
    const lastRecord = await Maintenance.findOne({ asset, status: 'completed' }).sort('-completedDate');
    const lastMaintenanceDaysAgo = lastRecord?.completedDate
      ? Math.round((Date.now() - new Date(lastRecord.completedDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const openComplaintsCount = await Complaint.countDocuments({
      asset,
      status: { $in: ['open', 'in_review', 'assigned', 'in_progress'] },
    });

    const aiResult = await predictMaintenancePriority({
      assetName: assetDoc.name,
      category: assetDoc.category,
      criticality: assetDoc.criticality,
      issueDescription: description || title,
      lastMaintenanceDaysAgo,
      openComplaintsCount,
    });

    record.priority = aiResult.priority;
    record.aiPriorityScore = aiResult.priorityScore;
    record.aiPriorityReasoning = aiResult.reasoning;
    await record.save();

    if (aiResult.priority === 'urgent') {
      await notifyAdmins({
        title: 'Urgent Maintenance Flagged by AI',
        message: `${assetDoc.name} requires urgent attention: ${aiResult.reasoning}`,
        type: 'ai_alert',
        relatedId: record._id,
        link: `/maintenance/${record._id}`,
        priority: 'high',
      });
    }
  } catch (err) {
    console.error('AI priority prediction failed (continuing without it):', err.message);
  }

  if (assignedTo) {
    await sendNotification({
      recipient: assignedTo,
      title: 'New Maintenance Task Assigned',
      message: `You've been assigned: "${title}" on ${new Date(scheduledDate).toLocaleDateString('en-IN')}`,
      type: 'maintenance',
      relatedId: record._id,
      link: `/maintenance/${record._id}`,
    });
  }

  await logActivity({
    user: req.user._id,
    action: 'CREATE_MAINTENANCE',
    module: 'maintenance',
    targetId: record._id,
    req,
  });

  // If linked to a complaint, mark it as assigned
  if (linkedComplaint) {
    await Complaint.findByIdAndUpdate(linkedComplaint, {
      status: 'assigned',
      linkedMaintenance: record._id,
    });
  }

  res.status(201).json({ success: true, data: record });
});

// @desc    Update maintenance record (status, completion, cost, parts, etc.)
// @route   PUT /api/maintenance/:id
// @access  Private/Admin/Supervisor/AssignedEmployee
const updateMaintenanceRecord = asyncHandler(async (req, res) => {
  const existing = await Maintenance.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  const isManager = req.user.role === 'admin' || req.user.role === 'supervisor';
  const isOwner = existing.assignedTo && existing.assignedTo.toString() === req.user._id.toString();

  if (!isManager && !isOwner) {
    res.status(403);
    throw new Error('You can only update maintenance tasks assigned to you');
  }

  // Managers can edit everything; the assigned employee can only update
  // progress fields (status/remarks/completion) - not cost, priority, or
  // reassign the task to someone else.
  const allowedFields = isManager
    ? ['status', 'priority', 'scheduledDate', 'completedDate', 'assignedTo', 'cost', 'partsUsed', 'remarks', 'description']
    : ['status', 'remarks', 'completedDate'];

  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // '' (Unassigned selected) can't be cast to an ObjectId - null clears the reference instead.
  if (updates.assignedTo === '') updates.assignedTo = null;

  if (updates.status === 'completed' && !updates.completedDate) {
    updates.completedDate = new Date();
  }

  const record = await Maintenance.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  // If completed and linked to a complaint, mark complaint resolved
  if (updates.status === 'completed' && record.linkedComplaint) {
    await Complaint.findByIdAndUpdate(record.linkedComplaint, {
      status: 'resolved',
      resolvedAt: new Date(),
    });
  }

  // Update asset status back to active if maintenance completed
  if (updates.status === 'completed') {
    await Asset.findByIdAndUpdate(record.asset, { status: 'active' });
  } else if (updates.status === 'in_progress') {
    await Asset.findByIdAndUpdate(record.asset, { status: 'under_maintenance' });
  }

  await logActivity({
    user: req.user._id,
    action: 'UPDATE_MAINTENANCE',
    module: 'maintenance',
    targetId: record._id,
    req,
  });

  res.json({ success: true, data: record });
});

// @desc    Delete/cancel maintenance record
// @route   DELETE /api/maintenance/:id
// @access  Private/Admin/Supervisor
const deleteMaintenanceRecord = asyncHandler(async (req, res) => {
  const record = await Maintenance.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  if (!record) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }
  res.json({ success: true, message: 'Maintenance task cancelled' });
});

module.exports = {
  getMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
};
