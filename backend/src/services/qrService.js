const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = cloudinary;

/**
 * Generates a QR code encoding a scannable reference to the asset
 * (its human-readable assetId + Mongo _id).
 *
 * This ALWAYS succeeds and returns a usable image, even with zero external
 * configuration:
 *   - If Cloudinary credentials are configured, the QR PNG is uploaded there
 *     and a permanent hosted URL is returned.
 *   - Otherwise (or if the Cloudinary upload fails for any reason), it falls
 *     back to returning the QR code as a base64 data URL, which is stored
 *     directly in MongoDB and renders fine in an <img src="..."> tag with no
 *     external dependency at all.
 */
const generateAssetQRCode = async (asset) => {
  const payload = JSON.stringify({
    type: 'ASSET',
    assetId: asset.assetId,
    id: asset._id.toString(),
  });

  // Data URL (base64 PNG) - this alone is enough to display/print the QR code.
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
  });

  if (!isCloudinaryConfigured()) {
    // No Cloudinary set up - use the data URL directly. Fully functional,
    // just not uploaded to external hosting.
    return dataUrl;
  }

  try {
    // Upload to Cloudinary so the QR image has a permanent, shareable URL
    const uploadResult = await cloudinary.uploader.upload(dataUrl, {
      folder: 'airport-asset-management/qrcodes',
      public_id: `qr-${asset.assetId}`,
      overwrite: true,
    });
    return uploadResult.secure_url;
  } catch (err) {
    // Never let a Cloudinary hiccup block asset creation/QR display -
    // fall back to the inline data URL instead.
    console.error('Cloudinary QR upload failed, using inline QR image instead:', err.message);
    return dataUrl;
  }
};

module.exports = { generateAssetQRCode };
