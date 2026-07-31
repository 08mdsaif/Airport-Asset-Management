const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true }, // e.g. CMP-2026-0001
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String, trim: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ type: String }], // Cloudinary URLs (photos of the issue)

    // AI Complaint Analysis fields
    aiCategory: { type: String }, // e.g. "Mechanical", "Electrical", "Safety Hazard"
    aiSeverity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    aiSentiment: { type: String, enum: ['neutral', 'frustrated', 'urgent'] },
    aiSummary: { type: String },
    aiSuggestedAction: { type: String },
    aiProcessedAt: { type: Date },

    status: {
      type: String,
      enum: ['open', 'in_review', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    linkedMaintenance: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance' },
  },
  { timestamps: true }
);

complaintSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);
