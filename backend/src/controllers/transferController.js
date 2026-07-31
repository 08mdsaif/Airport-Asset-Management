const asyncHandler = require('express-async-handler');
const AssetTransfer = require('../models/AssetTransfer');
const Asset = require('../models/Asset');
const { sendNotification } = require('../services/notificationService');
const logActivity = require('../utils/logActivity');

// @desc    Get transfer requests
// @route   GET /api/transfers
// @access  Private
const getTransfers = asyncHandler(async (req, res) => {
  const { status, asset, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (asset) filter.asset = asset;

  const transfers = await AssetTransfer.find(filter)
    .populate('asset', 'name assetId')
    .populate('fromDepartment toDepartment', 'name code')
    .populate('requestedBy approvedBy', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await AssetTransfer.countDocuments(filter);
  res.json({ success: true, data: transfers, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// @desc    Request an asset transfer between departments
// @route   POST /api/transfers
// @access  Private/Admin/Supervisor
const createTransfer = asyncHandler(async (req, res) => {
  const { asset, toDepartment, toLocation, reason } = req.body;

  const assetDoc = await Asset.findById(asset);
  if (!assetDoc) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const transfer = await AssetTransfer.create({
    asset,
    fromDepartment: assetDoc.department,
    toDepartment,
    fromLocation: assetDoc.location,
    toLocation,
    reason,
    requestedBy: req.user._id,
  });

  await logActivity({ user: req.user._id, action: 'REQUEST_TRANSFER', module: 'transfer', targetId: transfer._id, req });

  res.status(201).json({ success: true, data: transfer });
});

// @desc    Approve/reject/complete a transfer
// @route   PUT /api/transfers/:id
// @access  Private/Admin
const updateTransfer = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  const transfer = await AssetTransfer.findById(req.params.id);
  if (!transfer) {
    res.status(404);
    throw new Error('Transfer not found');
  }

  transfer.status = status || transfer.status;
  transfer.remarks = remarks ?? transfer.remarks;
  transfer.approvedBy = req.user._id;
  if (status === 'completed') transfer.transferDate = new Date();
  await transfer.save();

  // On completion, actually move the asset to its new department/location
  if (status === 'completed') {
    await Asset.findByIdAndUpdate(transfer.asset, {
      department: transfer.toDepartment,
      location: transfer.toLocation,
    });
  }

  await sendNotification({
    recipient: transfer.requestedBy,
    title: 'Asset Transfer Update',
    message: `Your transfer request is now: ${transfer.status}`,
    type: 'transfer',
    relatedId: transfer._id,
    link: `/transfers/${transfer._id}`,
  });

  await logActivity({ user: req.user._id, action: 'UPDATE_TRANSFER', module: 'transfer', targetId: transfer._id, req });

  res.json({ success: true, data: transfer });
});

module.exports = { getTransfers, createTransfer, updateTransfer };
