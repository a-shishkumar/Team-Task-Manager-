const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { setTokenCookies, clearTokenCookies } = require('../utils/tokenUtils');

exports.signup = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.signup(req.body);
  setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.created(res, { user, accessToken, refreshToken }, 'Account created successfully');
});

exports.login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body.email, req.body.password);
  setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, { user, accessToken, refreshToken }, 'Login successful');
});

exports.logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  await authService.logout(req.user._id, refreshToken);
  clearTokenCookies(res);
  ApiResponse.success(res, null, 'Logged out successfully');
});

exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(token);
  setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, { accessToken, refreshToken }, 'Token refreshed');
});

exports.verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  ApiResponse.success(res, null, 'Email verified successfully');
});

exports.forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.success(res, null, 'Password reset email sent');
});

exports.resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.success(res, null, 'Password reset successful');
});

exports.getMe = catchAsync(async (req, res) => {
  ApiResponse.success(res, { user: req.user });
});
