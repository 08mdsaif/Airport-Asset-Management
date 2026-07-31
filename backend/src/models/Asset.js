const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true, unique: true }, // e.g. AAI-BLR-0001
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Baggage Handling',
        'Escalator/Elevator',
        'HVAC',
        'Electrical',
        'Ground Support Equipment',
        'IT/Networking',
        'Fire Safety',
        'Runway/Airfield',
        'Furniture',
        'Other',
      ],
      default: 'Other',
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    location: { type: String, trim: true }, // e.g. Terminal 2, Gate 14
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number, default: 0 },
    warrantyExpiry: { type: Date },
    status: {
      type: String,
      enum: ['active', 'under_maintenance', 'critical', 'decommissioned'],
      default: 'active',
    },
    criticality: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    utilization: { type: Number, min: 0, max: 100, default: 0 }, // percentage, updated by IoT/manual entry
    qrCodeUrl: { type: String }, // generated QR code data URL / Cloudinary URL
    image: { type: String }, // Cloudinary URL
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

assetSchema.index({ name: 'text', assetId: 'text', serialNumber: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
