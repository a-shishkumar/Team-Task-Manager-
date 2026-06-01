const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(permissionController.getPermissions)
  .put(authorize('admin'), permissionController.updatePermissions);

module.exports = router;
