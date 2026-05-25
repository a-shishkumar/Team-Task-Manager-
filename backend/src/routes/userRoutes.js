const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfile, changePassword } = require('../validators/authValidator');
const { cache } = require('../middleware/cache');

router.use(protect);
router.get('/', cache(120), userController.getUsers);
router.get('/dashboard', cache(60), userController.getDashboardStats);
router.get('/:id', cache(120), userController.getUserById);
router.put('/profile', validate(updateProfile), userController.updateProfile);
router.put('/change-password', validate(changePassword), userController.changePassword);
router.post('/', authorize('admin'), userController.createUser);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.put('/:id/role', authorize('admin'), userController.updateRole);
router.put('/:id/deactivate', authorize('admin'), userController.deactivateUser);

module.exports = router;
