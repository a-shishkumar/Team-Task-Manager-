const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signup, login, forgotPassword, resetPassword } = require('../validators/authValidator');

router.post('/signup', validate(signup), authController.signup);
router.post('/login', validate(login), authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', validate(forgotPassword), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPassword), authController.resetPassword);
router.get('/me', protect, authController.getMe);

module.exports = router;
