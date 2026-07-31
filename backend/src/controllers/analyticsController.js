const asyncHandler = require('express-async-handler');
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');

// @desc    Assets grouped by department (for pie/bar chart)
// @route   GET /api/analytics/assets-by-department
const assetsByDepartment = asyncHandler(async (req, res) => {
  const data = await Asset.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, department: { $ifNull: ['$department.name', 'Unassigned'] }, count: 1 } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data });
});

// @desc    Pending maintenance count grouped by status (for bar/donut chart)
// @route   GET /api/analytics/pending-maintenance
const pendingMaintenance = asyncHandler(async (req, res) => {
  const data = await Maintenance.aggregate([
    { $match: { status: { $in: ['scheduled', 'in_progress', 'overdue'] } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);
  res.json({ success: true, data });
});

// @desc    Critical assets list + count (for dashboard widget)
// @route   GET /api/analytics/critical-assets
const criticalAssets = asyncHandler(async (req, res) => {
  const assets = await Asset.find({ $or: [{ status: 'critical' }, { criticality: 'critical' }] })
    .populate('department', 'name')
    .select('name assetId category status criticality department')
    .limit(50);
  res.json({ success: true, data: assets, count: assets.length });
});

// @desc    Monthly repair/maintenance cost trend (for line chart)
// @route   GET /api/analytics/monthly-repair-cost
const monthlyRepairCost = asyncHandler(async (req, res) => {
  const monthsBack = Number(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  const data = await Maintenance.aggregate([
    { $match: { status: 'completed', completedDate: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$completedDate' }, month: { $month: '$completedDate' } },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        label: {
          $concat: [{ $toString: '$_id.month' }, '/', { $toString: '$_id.year' }],
        },
        totalCost: 1,
        count: 1,
      },
    },
  ]);
  res.json({ success: true, data });
});

// @desc    Average asset utilization by category (for bar chart)
// @route   GET /api/analytics/asset-utilization
const assetUtilization = asyncHandler(async (req, res) => {
  const data = await Asset.aggregate([
    { $group: { _id: '$category', avgUtilization: { $avg: '$utilization' }, count: { $sum: 1 } } },
    { $project: { _id: 0, category: '$_id', avgUtilization: { $round: ['$avgUtilization', 1] }, count: 1 } },
    { $sort: { avgUtilization: -1 } },
  ]);
  res.json({ success: true, data });
});

// @desc    Complaint trends over time (for line/area chart)
// @route   GET /api/analytics/complaint-trends
const complaintTrends = asyncHandler(async (req, res) => {
  const monthsBack = Number(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  const data = await Complaint.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        raised: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        label: { $concat: [{ $toString: '$_id.month' }, '/', { $toString: '$_id.year' }] },
        raised: 1,
        resolved: 1,
      },
    },
  ]);
  res.json({ success: true, data });
});

// @desc    High-level dashboard summary counts (KPI cards)
// @route   GET /api/analytics/summary
const summary = asyncHandler(async (req, res) => {
  const [totalAssets, criticalCount, openComplaints, pendingMaintenanceCount, totalDepartments] = await Promise.all([
    Asset.countDocuments(),
    Asset.countDocuments({ $or: [{ status: 'critical' }, { criticality: 'critical' }] }),
    Complaint.countDocuments({ status: { $in: ['open', 'in_review', 'assigned', 'in_progress'] } }),
    Maintenance.countDocuments({ status: { $in: ['scheduled', 'in_progress', 'overdue'] } }),
    Department.countDocuments({ isActive: true }),
  ]);

  res.json({
    success: true,
    data: { totalAssets, criticalCount, openComplaints, pendingMaintenanceCount, totalDepartments },
  });
});

module.exports = {
  assetsByDepartment,
  pendingMaintenance,
  criticalAssets,
  monthlyRepairCost,
  assetUtilization,
  complaintTrends,
  summary,
};
