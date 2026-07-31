const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['complaint', 'maintenance', 'asset', 'transfer', 'system', 'ai_alert'],
      default: 'system',
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // id of the related complaint/asset/maintenance doc
    link: { type: String }, // frontend route to deep-link, e.g. /complaints/:id
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
