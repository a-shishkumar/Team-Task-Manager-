const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

/**
 * File filter - validates file type
 */
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      ),
      false
    );
  }
};

/**
 * Upload middleware for avatars (images only, 2MB max)
 */
const uploadAvatar = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
}).single('avatar');

/**
 * Upload middleware for attachments (images + docs, 5MB max)
 */
const uploadAttachment = multer({
  storage,
  fileFilter: fileFilter(ALL_ALLOWED_TYPES),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('file');

/**
 * Upload middleware for multiple attachments
 */
const uploadAttachments = multer({
  storage,
  fileFilter: fileFilter(ALL_ALLOWED_TYPES),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
}).array('files', 5);

module.exports = { uploadAvatar, uploadAttachment, uploadAttachments };
