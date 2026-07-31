const mongoose = require('mongoose');

const assetTransferSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    fromDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    toDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    fromLocation: { type: String, trim: true },
    toLocation: { type: String, trim: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    reason: { type: String, trim: true },
    transferDate: { type: Date },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssetTransfer', assetTransferSchema);
