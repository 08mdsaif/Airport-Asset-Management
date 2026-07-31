const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    type: {
      type: String,
      enum: ['preventive', 'corrective', 'predictive', 'emergency'],
      default: 'preventive',
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    aiPriorityScore: { type: Number, min: 0, max: 100 }, // AI-predicted priority score
    aiPriorityReasoning: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'scheduled',
    },
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    linkedComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    cost: { type: Number, default: 0 },
    partsUsed: [{ name: String, quantity: Number, cost: Number }],
    attachments: [{ type: String }], // Cloudinary URLs
    remarks: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
