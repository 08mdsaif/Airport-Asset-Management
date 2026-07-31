const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const Complaint = require('../models/Complaint');
const { generateSequentialId } = require('../utils/idGenerator');
const { generateAssetQRCode } = require('../services/qrService');
const { summarizeAssetHistory } = require('../services/geminiService');
const { uploadBufferToCloudinary } = require('../services/cloudinaryUpload');
const logActivity = require('../utils/logActivity');
const { notifyAdmins } = require('../services/notificationService');

// @desc    Get all assets (filterable, searchable, paginated)
// @route   GET /api/assets
// @access  Private
const getAssets = asyncHandler(async (req, res) => {
  const { department, category, status, criticality, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (criticality) filter.criticality = criticality;
  if (search) filter.$text = { $search: search };

  const assets = await Asset.find(filter)
    .populate('department', 'name code')
    .populate('assignedTo', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Asset.countDocuments(filter);

  res.json({ success: true, data: assets, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate('department', 'name code')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  res.json({ success: true, data: asset });
});

// @desc    Look up an asset by its scanned QR payload (assetId or Mongo _id)
// @route   GET /api/assets/lookup/:code
// @access  Private
const lookupAssetByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const orConditions = [{ assetId: code }];
  if (mongoose.Types.ObjectId.isValid(code)) {
    orConditions.push({ _id: code });
  }

  const asset = await Asset.findOne({ $or: orConditions })
    .populate('department', 'name code')
    .populate('assignedTo', 'name email');

  if (!asset) {
    res.status(404);
    throw new Error('No asset found for this QR code');
  }
  res.json({ success: true, data: asset });
});

// @desc    Create asset (auto-generates ID + QR code)
// @route   POST /api/assets
// @access  Private/Admin/Supervisor
const createAsset = asyncHandler(async (req, res) => {
  const assetId = await generateSequentialId(Asset, 'assetId', 'AST');

  let imageUrl;
  if (req.file) {
    imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'airport-asset-management/assets');
  }

  const asset = await Asset.create({
    ...req.body,
    assetId,
    createdBy: req.user._id,
    image: imageUrl,
  });

  // Generate & attach QR code right after creation (needs the Mongo _id).
  // This is intentionally isolated: if QR generation fails for any reason,
  // the asset itself must still be created successfully. The QR can always
  // be regenerated later via POST /api/assets/:id/qrcode.
  try {
    asset.qrCodeUrl = await generateAssetQRCode(asset);
    await asset.save();
  } catch (err) {
    console.error(`QR code generation failed for asset ${asset.assetId} (asset was still created):`, err.message);
  }

  await logActivity({ user: req.user._id, action: 'CREATE_ASSET', module: 'asset', targetId: asset._id, req });

  res.status(201).json({ success: true, data: asset });
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private/Admin/Supervisor
const updateAsset = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) {
    updates.image = await uploadBufferToCloudinary(req.file.buffer, 'airport-asset-management/assets');
  }
  // An empty string can't be cast to an ObjectId - treat it as "clear this reference".
  if (updates.assignedTo === '') updates.assignedTo = null;

  const asset = await Asset.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  // If status flips to critical, alert admins/supervisors in real time
  if (updates.status === 'critical') {
    await notifyAdmins({
      title: 'Critical Asset Alert',
      message: `Asset ${asset.name} (${asset.assetId}) has been marked CRITICAL.`,
      type: 'asset',
      relatedId: asset._id,
      link: `/assets/${asset._id}`,
      priority: 'high',
    });
  }

  await logActivity({ user: req.user._id, action: 'UPDATE_ASSET', module: 'asset', targetId: asset._id, req });

  res.json({ success: true, data: asset });
});

// @desc    Delete (decommission) asset
// @route   DELETE /api/assets/:id
// @access  Private/Admin
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, { status: 'decommissioned' }, { new: true });
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  await logActivity({ user: req.user._id, action: 'DECOMMISSION_ASSET', module: 'asset', targetId: asset._id, req });

  res.json({ success: true, message: 'Asset decommissioned', data: asset });
});

// @desc    Regenerate an asset's QR code
// @route   POST /api/assets/:id/qrcode
// @access  Private/Admin/Supervisor
const regenerateQRCode = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  asset.qrCodeUrl = await generateAssetQRCode(asset);
  await asset.save();

  res.json({ success: true, data: { qrCodeUrl: asset.qrCodeUrl } });
});

// @desc    AI-generated summary of an asset's full history (maintenance + complaints)
// @route   GET /api/assets/:id/ai-summary
// @access  Private
const getAssetAISummary = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const [maintenanceRecords, complaints] = await Promise.all([
    Maintenance.find({ asset: asset._id }).sort('-createdAt').lean(),
    Complaint.find({ asset: asset._id }).sort('-createdAt').lean(),
  ]);

  const summary = await summarizeAssetHistory({ asset, maintenanceRecords, complaints });

  res.json({ success: true, data: { summary, maintenanceCount: maintenanceRecords.length, complaintCount: complaints.length } });
});

module.exports = {
  getAssets,
  getAsset,
  lookupAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset,
  regenerateQRCode,
  getAssetAISummary,
};
