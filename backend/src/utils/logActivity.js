const ActivityLog = require('../models/ActivityLog');

// Fire-and-forget activity logger. Never throws, so it can't break the main request flow.
const logActivity = async ({ user, action, module, targetId, description, req, metadata }) => {
  try {
    await ActivityLog.create({
      user,
      action,
      module,
      targetId,
      description,
      ipAddress: req?.ip,
      metadata,
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
