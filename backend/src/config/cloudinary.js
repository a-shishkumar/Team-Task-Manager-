const cloudinary = require('cloudinary').v2;
const config = require('./index');
const logger = require('../utils/logger');

// Configure Cloudinary immediately
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

logger.info('Cloudinary configured successfully');

/**
 * Upload a file from a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'team-task-manager',
        ...options,
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary asset public ID
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Cloudinary deletion failed: ${error.message}`);
    throw error;
  }
};

module.exports = { cloudinary, uploadBuffer, deleteFile };

