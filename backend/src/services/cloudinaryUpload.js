const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = cloudinary;

/**
 * Uploads a single in-memory file buffer (from multer.memoryStorage) to Cloudinary.
 * @param {Buffer} buffer
 * @param {String} folder - Cloudinary folder, e.g. 'airport-asset-management/assets'
 * @returns {Promise<string>} secure_url of the uploaded file
 */
const uploadBufferToCloudinary = (buffer, folder = 'airport-asset-management') => {
  if (!isCloudinaryConfigured()) {
    // Fail with a clear, actionable message rather than letting Cloudinary's
    // SDK throw a cryptic "cloud_name is disabled" / auth error.
    return Promise.reject(
      new Error(
        'Image upload is unavailable: Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, ' +
          'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env (see .env.example).'
      )
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/** Uploads multiple files (req.files from multer) in parallel, returns array of secure_urls */
const uploadManyToCloudinary = (files = [], folder = 'airport-asset-management') => {
  return Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer, folder)));
};

module.exports = { uploadBufferToCloudinary, uploadManyToCloudinary };
