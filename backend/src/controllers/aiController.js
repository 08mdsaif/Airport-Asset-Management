const asyncHandler = require('express-async-handler');
const Asset = require('../models/Asset');
const Complaint = require('../models/Complaint');
const Maintenance = require('../models/Maintenance');
const { chatAssistant } = require('../services/geminiService');

// @desc    Chat with the AI employee assistant
// @route   POST /api/ai/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  // Give the assistant light situational context about the requesting user
  const [myOpenComplaints, myPendingMaintenance] = await Promise.all([
    Complaint.countDocuments({ raisedBy: req.user._id, status: { $ne: 'resolved' } }),
    Maintenance.countDocuments({ assignedTo: req.user._id, status: { $in: ['scheduled', 'in_progress'] } }),
  ]);

  const contextData = {
    userName: req.user.name,
    userRole: req.user.role,
    myOpenComplaints,
    myPendingMaintenanceTasks: myPendingMaintenance,
  };

  const reply = await chatAssistant({ message, history, contextData });

  res.json({ success: true, data: { reply } });
});

module.exports = { chat };
