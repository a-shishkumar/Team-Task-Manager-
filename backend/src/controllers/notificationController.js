const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getAll = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const notifications = await Notification.find(filter).populate('sender', 'name avatar').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

  ApiResponse.paginated(res, { notifications, unreadCount }, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

exports.markAsRead = catchAsync(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, readAt: new Date() });
  ApiResponse.success(res, null, 'Notification marked as read');
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  ApiResponse.success(res, null, 'All notifications marked as read');
});

exports.delete = catchAsync(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  ApiResponse.success(res, null, 'Notification deleted');
});
