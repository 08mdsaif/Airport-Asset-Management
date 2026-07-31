const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { generateSequentialId } = require('../utils/idGenerator');
const { classifyComplaint } = require('../services/geminiService');
const { uploadManyToCloudinary } = require('../services/cloudinaryUpload');
const { sendNotification, notifyAdmins } = require('../services/notificationService');
const logActivity = require('../utils/logActivity');

// @desc    Get complaints (filterable; employees see their own, admins see all)
// @route   GET /api/complaints
// @access  Private
const getComplaints = asyncHandler(async (req, res) => {
  const { status, priority, department, asset, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  // Employees only see complaints they raised or that are assigned to them
  if (req.user.role === 'employee') {
    filter.$or = [{ raisedBy: req.user._id }, { assignedTo: req.user._id }];
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (department) filter.department = department;
  if (asset) filter.asset = asset;
  if (search) filter.$text = { $search: search };

  const complaints = await Complaint.find(filter)
    .populate('asset', 'name assetId category')
    .populate('department', 'name code')
    .populate('raisedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Complaint.countDocuments(filter);

  res.json({ success: true, data: complaints, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('asset', 'name assetId category')
    .populate('department', 'name code')
    .populate('raisedBy', 'name email')
    .populate('assignedTo', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  res.json({ success: true, data: complaint });
});

// @desc    Create complaint - automatically runs AI classification
// @route   POST /api/complaints
// @access  Private
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, asset, department, location } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  const complaintId = await generateSequentialId(Complaint, 'complaintId', 'CMP');

  let assetDoc = null;
  if (asset) assetDoc = await Asset.findById(asset);

  let attachmentUrls = [];
  if (req.files?.length) {
    attachmentUrls = await uploadManyToCloudinary(req.files, 'airport-asset-management/complaints');
  }

  const complaint = await Complaint.create({
    complaintId,
    title,
    description,
    asset,
    department: department || assetDoc?.department,
    location: location || assetDoc?.location,
    raisedBy: req.user._id,
    attachments: attachmentUrls,
  });

  // --- AI Complaint Analysis (auto complaint classification) ---
  try {
    const aiResult = await classifyComplaint({
      title,
      description,
      assetCategory: assetDoc?.category,
    });

    complaint.aiCategory = aiResult.category;
    complaint.aiSeverity = aiResult.severity;
    complaint.aiSentiment = aiResult.sentiment;
    complaint.aiSummary = aiResult.summary;
    complaint.aiSuggestedAction = aiResult.suggestedAction;
    complaint.aiProcessedAt = new Date();
    complaint.priority = aiResult.severity; // seed initial priority from AI severity assessment
    await complaint.save();
  } catch (err) {
    console.error('AI complaint classification failed (continuing without it):', err.message);
  }

  await logActivity({
    user: req.user._id,
    action: 'CREATE_COMPLAINT',
    module: 'complaint',
    targetId: complaint._id,
    req,
  });

  // Notify admins/supervisors of the new complaint
  await notifyAdmins({
    title: 'New Complaint Filed',
    message: `${req.user.name} filed: "${title}" (${complaint.complaintId})`,
    type: 'complaint',
    relatedId: complaint._id,
    link: `/complaints/${complaint._id}`,
    priority: complaint.aiSeverity === 'critical' ? 'high' : 'medium',
  });

  res.status(201).json({ success: true, data: complaint });
});

// @desc    Update complaint (status, assignment, resolution)
// @route   PUT /api/complaints/:id
// @access  Private/Admin/Supervisor
const updateComplaint = asyncHandler(async (req, res) => {
  const allowedFields = ['status', 'priority', 'assignedTo', 'resolutionNotes'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (updates.status === 'resolved') updates.resolvedAt = new Date();

  const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Notify the person who raised it about status changes
  if (updates.status) {
    await sendNotification({
      recipient: complaint.raisedBy,
      title: 'Complaint Status Updated',
      message: `Your complaint "${complaint.title}" is now: ${updates.status.replace('_', ' ')}`,
      type: 'complaint',
      relatedId: complaint._id,
      link: `/complaints/${complaint._id}`,
    });
  }

  // Notify newly assigned staff
  if (updates.assignedTo) {
    await sendNotification({
      recipient: updates.assignedTo,
      title: 'Complaint Assigned to You',
      message: `You have been assigned: "${complaint.title}" (${complaint.complaintId})`,
      type: 'complaint',
      relatedId: complaint._id,
      link: `/complaints/${complaint._id}`,
      priority: 'high',
    });
  }

  await logActivity({
    user: req.user._id,
    action: 'UPDATE_COMPLAINT',
    module: 'complaint',
    targetId: complaint._id,
    req,
  });

  res.json({ success: true, data: complaint });
});

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private/Admin
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  res.json({ success: true, message: 'Complaint rejected/closed' });
});

// @desc    Re-run AI classification manually (e.g. after edits)
// @route   POST /api/complaints/:id/reanalyze
// @access  Private/Admin/Supervisor
const reanalyzeComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate('asset', 'category');
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const aiResult = await classifyComplaint({
    title: complaint.title,
    description: complaint.description,
    assetCategory: complaint.asset?.category,
  });

  complaint.aiCategory = aiResult.category;
  complaint.aiSeverity = aiResult.severity;
  complaint.aiSentiment = aiResult.sentiment;
  complaint.aiSummary = aiResult.summary;
  complaint.aiSuggestedAction = aiResult.suggestedAction;
  complaint.aiProcessedAt = new Date();
  await complaint.save();

  res.json({ success: true, data: complaint });
});

module.exports = {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  reanalyzeComplaint,
};
