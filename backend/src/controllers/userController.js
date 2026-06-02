const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadBuffer, deleteFile } = require('../config/cloudinary');

exports.updateAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload an image file');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  // If user already has an avatar in Cloudinary, delete it first
  if (user.avatar && user.avatar.publicId) {
    await deleteFile(user.avatar.publicId).catch(() => {});
  }

  // Upload new avatar buffer
  const result = await uploadBuffer(req.file.buffer, {
    folder: 'team-task-manager/avatars',
    transformation: [{ width: 250, height: 250, crop: 'thumb', gravity: 'face' }]
  });

  user.avatar = {
    url: result.secure_url,
    publicId: result.public_id
  };
  await user.save();

  ApiResponse.success(res, { user }, 'Avatar updated successfully');
});

exports.getUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  } else if (req.user.role !== 'admin') {
    // Non-admins only see active users by default
    filter.isActive = true;
  }

  if (req.query.search) {
    filter.$or = [{ name: new RegExp(req.query.search, 'i') }, { email: new RegExp(req.query.search, 'i') }];
  }
  if (req.query.role) filter.role = req.query.role;

  const users = await User.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit);
  const total = await User.countDocuments(filter);
  ApiResponse.paginated(res, users, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  ApiResponse.success(res, { user });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, department, title, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, department, title, phone }, { new: true, runValidators: true });
  ApiResponse.success(res, { user }, 'Profile updated');
});

exports.changePassword = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');
  user.password = req.body.newPassword;
  user.refreshTokens = [];
  await user.save();
  ApiResponse.success(res, null, 'Password changed successfully');
});

exports.updateRole = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Only admins can change roles');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  ApiResponse.success(res, { user }, 'Role updated');
});

exports.deactivateUser = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Only admins can deactivate users');
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  ApiResponse.success(res, { user }, 'User deactivated');
});

exports.createUser = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Only admins can create users');
  const { name, email, password, role, department, title, phone } = req.body;
  
  // Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) throw ApiError.conflict('Email is already registered');

  const user = await User.create({
    name,
    email,
    password: password || 'TempPass123!',
    role: role || 'member',
    department: department || '',
    title: title || '',
    phone: phone || '',
    isActive: true,
  });

  ApiResponse.created(res, { user }, 'User created successfully');
});

exports.updateUser = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Only admins can update users');
  const { name, email, role, department, title, phone, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw ApiError.conflict('Email is already registered');
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, department, title, phone, isActive },
    { new: true, runValidators: true }
  );

  ApiResponse.success(res, { user: updated }, 'User updated successfully');
});

exports.deleteUser = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Only admins can delete users');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Hard delete
  await User.findByIdAndDelete(req.params.id);
  
  // Also clean up tasks assigned to this user
  await Task.updateMany({ assignee: req.params.id }, { $unset: { assignee: '' } });

  ApiResponse.success(res, null, 'User deleted successfully');
});

exports.getDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const userProjects = await Project.find({ $or: [{ owner: userId }, { 'members.user': userId }] }).select('_id');
  const projectIds = userProjects.map((p) => p._id);

  const [projectCount, taskStats, recentTasks, recentActivity, memberCount] = await Promise.all([
    Project.countDocuments({ $or: [{ owner: userId }, { 'members.user': userId }], isArchived: false }),
    Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: null, total: { $sum: 1 }, todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } }, inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }, review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'completed'] }, { $lt: ['$dueDate', new Date()] }, { $ne: ['$dueDate', null] }] }, 1, 0] } } } }
    ]),
    Task.find({ project: { $in: projectIds } }).populate('assignee', 'name avatar').populate('project', 'name color').sort({ createdAt: -1 }).limit(10),
    ActivityLog.find({ $or: [{ user: userId }, { project: { $in: projectIds } }] }).populate('user', 'name avatar').sort({ createdAt: -1 }).limit(15),
    User.countDocuments({ isActive: true }),
  ]);

  // Weekly task completion data for charts
  const weeklyData = await Task.aggregate([
    { $match: { project: { $in: projectIds }, completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dayOfWeek: '$completedAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  ApiResponse.success(res, {
    projects: projectCount,
    tasks: taskStats[0] || { total: 0, todo: 0, inProgress: 0, review: 0, completed: 0, overdue: 0 },
    members: memberCount,
    recentTasks,
    recentActivity,
    weeklyData,
  });
});
