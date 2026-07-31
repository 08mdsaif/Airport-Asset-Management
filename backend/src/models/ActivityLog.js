const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. "CREATE_ASSET", "LOGIN", "RESOLVE_COMPLAINT"
    module: {
      type: String,
      enum: [
        'auth',
        'asset',
        'maintenance',
        'complaint',
        'user',
        'department',
        'transfer',
        'notification',
        'report',
      ],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String },
    ipAddress: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
