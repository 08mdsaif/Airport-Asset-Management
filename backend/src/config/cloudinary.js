const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Detects whether real Cloudinary credentials have been provided (as opposed
// to being unset or left as the placeholder values from .env.example).
// Used to fail fast with a clear message instead of a cryptic Cloudinary
// auth error, and to let QR generation gracefully fall back when unset.
const PLACEHOLDER_PATTERN = /your_cloud|your_api|change_this|^$/i;

const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return (
    !!CLOUDINARY_CLOUD_NAME &&
    !!CLOUDINARY_API_KEY &&
    !!CLOUDINARY_API_SECRET &&
    !PLACEHOLDER_PATTERN.test(CLOUDINARY_CLOUD_NAME) &&
    !PLACEHOLDER_PATTERN.test(CLOUDINARY_API_KEY) &&
    !PLACEHOLDER_PATTERN.test(CLOUDINARY_API_SECRET)
  );
};

module.exports = cloudinary;
module.exports.isCloudinaryConfigured = isCloudinaryConfigured;
