const Notification = require('../models/Notification');
const { getIO } = require('../socket');

/**
 * Creates a notification in MongoDB and pushes it in real-time via Socket.IO.
 * @param {Object} params
 * @param {String} params.recipient - User ID to notify
 * @param {String} params.title
 * @param {String} params.message
 * @param {String} params.type - complaint | maintenance | asset | transfer | system | ai_alert
 * @param {String} [params.relatedId]
 * @param {String} [params.link]
 * @param {String} [params.priority] - low | medium | high
 */
const sendNotification = async ({ recipient, title, message, type, relatedId, link, priority = 'medium' }) => {
  const notification = await Notification.create({
    recipient,
    title,
    message,
    type,
    relatedId,
    link,
    priority,
  });

  try {
    const io = getIO();
    io.to(`user:${recipient}`).emit('notification:new', notification);
  } catch (err) {
    // Socket layer may not be initialized in certain test contexts - safe to ignore
    console.warn('Socket emit skipped:', err.message);
  }

  return notification;
};

/** Broadcasts to all admins/supervisors (e.g. critical asset alerts) */
const notifyAdmins = async ({ title, message, type, relatedId, link, priority = 'high' }) => {
  try {
    const io = getIO();
    io.to('admins').emit('notification:broadcast', { title, message, type, relatedId, link, priority });
  } catch (err) {
    console.warn('Broadcast skipped:', err.message);
  }
};

module.exports = { sendNotification, notifyAdmins };
