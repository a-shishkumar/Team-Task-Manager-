const cloudinary = require('cloudinary').v2;
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Configure Cloudinary for file uploads
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });

  logger.info('Cloudinary configured successfully');
  return cloudinary;
};

module.exports = { configureCloudinary, cloudinary };
