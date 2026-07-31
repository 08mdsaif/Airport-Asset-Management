const multer = require('multer');

// Files are kept in memory as buffers; controllers explicitly upload them to
// Cloudinary via services/cloudinaryUpload.js. This avoids depending on
// multer-storage-cloudinary, which only supports the Cloudinary v1 SDK.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

module.exports = upload;
