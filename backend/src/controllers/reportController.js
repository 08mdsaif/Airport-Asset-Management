const asyncHandler = require('express-async-handler');
const Maintenance = require('../models/Maintenance');
const Complaint = require('../models/Complaint');
const Asset = require('../models/Asset');
const { streamReportPDF } = require('../services/pdfService');
const { generateMaintenanceReport } = require('../services/geminiService');

// @desc    Export a maintenance summary report as PDF (with AI-written narrative)
// @route   GET /api/reports/maintenance-pdf?from=&to=
// @access  Private/Admin/Supervisor
const exportMaintenanceReportPDF = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const startDate = from ? new Date(from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = to ? new Date(to) : new Date();

  const records = await Maintenance.find({
    scheduledDate: { $gte: startDate, $lte: endDate },
  })
    .populate('asset', 'name assetId category')
    .populate('assignedTo', 'name')
    .lean();

  const stats = {
    totalTasks: records.length,
    completed: records.filter((r) => r.status === 'completed').length,
    overdue: records.filter((r) => r.status === 'overdue').length,
    totalCost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
    byPriority: records.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, {}),
  };

  const periodLabel = `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;

  let narrative;
  try {
    narrative = await generateMaintenanceReport({ periodLabel, stats, records });
  } catch (err) {
    console.error('AI report narrative failed, using fallback text:', err.message);
    narrative = `During ${periodLabel}, a total of ${stats.totalTasks} maintenance tasks were logged, of which ${stats.completed} were completed and ${stats.overdue} are overdue. Total recorded cost: Rs. ${stats.totalCost}.`;
  }

  streamReportPDF(res, {
    filename: `maintenance-report-${Date.now()}.pdf`,
    title: 'Maintenance Summary Report',
    subtitle: periodLabel,
    sections: [{ heading: 'AI-Generated Summary', body: narrative }],
    table: {
      headers: ['Asset', 'Type', 'Priority', 'Status', 'Scheduled', 'Cost (Rs.)'],
      rows: records
        .slice(0, 40)
        .map((r) => [
          r.asset?.name || 'N/A',
          r.type,
          r.priority,
          r.status,
          new Date(r.scheduledDate).toLocaleDateString('en-IN'),
          r.cost || 0,
        ]),
    },
  });
});

// @desc    Export complaint summary report as PDF
// @route   GET /api/reports/complaints-pdf?from=&to=
// @access  Private/Admin/Supervisor
const exportComplaintReportPDF = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const startDate = from ? new Date(from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = to ? new Date(to) : new Date();

  const complaints = await Complaint.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .populate('asset', 'name assetId')
    .populate('raisedBy', 'name')
    .lean();

  const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const open = complaints.length - resolved;

  streamReportPDF(res, {
    filename: `complaint-report-${Date.now()}.pdf`,
    title: 'Complaint Summary Report',
    subtitle: `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`,
    sections: [
      {
        heading: 'Overview',
        body: `A total of ${complaints.length} complaints were logged in this period. ${resolved} have been resolved or closed, while ${open} remain open or in progress.`,
      },
    ],
    table: {
      headers: ['Complaint ID', 'Title', 'AI Category', 'Priority', 'Status', 'Raised By'],
      rows: complaints
        .slice(0, 40)
        .map((c) => [c.complaintId, c.title, c.aiCategory || '-', c.priority, c.status, c.raisedBy?.name || 'N/A']),
    },
  });
});

// @desc    Export a single asset's full report (details + history) as PDF
// @route   GET /api/reports/asset-pdf/:id
// @access  Private
const exportAssetReportPDF = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id).populate('department', 'name');
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const [maintenanceRecords, complaints] = await Promise.all([
    Maintenance.find({ asset: asset._id }).sort('-scheduledDate').lean(),
    Complaint.find({ asset: asset._id }).sort('-createdAt').lean(),
  ]);

  streamReportPDF(res, {
    filename: `asset-report-${asset.assetId}.pdf`,
    title: `Asset Report: ${asset.name}`,
    subtitle: `${asset.assetId} • ${asset.department?.name || 'Unassigned'} • Status: ${asset.status}`,
    sections: [
      {
        heading: 'Asset Details',
        body: `Category: ${asset.category} | Criticality: ${asset.criticality} | Utilization: ${asset.utilization}% | Manufacturer: ${asset.manufacturer || 'N/A'} | Model: ${asset.model || 'N/A'} | Purchased: ${asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('en-IN') : 'N/A'}`,
      },
    ],
    table: {
      headers: ['Type', 'Date', 'Status', 'Priority'],
      rows: maintenanceRecords
        .slice(0, 30)
        .map((m) => [m.type, new Date(m.scheduledDate).toLocaleDateString('en-IN'), m.status, m.priority]),
    },
  });
});

module.exports = { exportMaintenanceReportPDF, exportComplaintReportPDF, exportAssetReportPDF };
