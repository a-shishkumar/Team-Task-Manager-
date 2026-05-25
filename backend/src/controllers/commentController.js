const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.create = catchAsync(async (req, res) => {
  const task = await Task.findById(req.body.taskId || req.params.taskId);
  if (!task) throw ApiError.notFound('Task not found');
  const project = await Project.findById(task.project);
  if (!project.isMember(req.user._id)) throw ApiError.forbidden('Access denied');

  const comment = await Comment.create({ content: req.body.content, task: task._id, author: req.user._id, parentComment: req.body.parentComment || null });
  await comment.populate('author', 'name email avatar');

  // Notify task assignee/reporter
  const notifyUsers = [task.assignee?.toString(), task.reporter?.toString()].filter((id) => id && id !== req.user._id.toString());
  for (const rid of [...new Set(notifyUsers)]) {
    await Notification.create({ recipient: rid, sender: req.user._id, type: 'task_comment', title: 'New Comment', message: `${req.user.name} commented on "${task.title}"`, relatedProject: project._id, relatedTask: task._id });
  }
  await ActivityLog.create({ user: req.user._id, action: 'comment_added', entityType: 'comment', entityId: comment._id, project: project._id, details: { taskTitle: task.title } });
  ApiResponse.created(res, { comment });
});

exports.getByTask = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const comments = await Comment.find({ task: req.params.taskId, parentComment: null }).populate('author', 'name email avatar').populate({ path: 'replies', populate: { path: 'author', select: 'name email avatar' } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  const total = await Comment.countDocuments({ task: req.params.taskId, parentComment: null });
  ApiResponse.paginated(res, comments, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

exports.update = catchAsync(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.author.toString() !== req.user._id.toString()) throw ApiError.forbidden('You can only edit your own comments');
  comment.content = req.body.content;
  comment.isEdited = true;
  await comment.save();
  await comment.populate('author', 'name email avatar');
  ApiResponse.success(res, { comment }, 'Comment updated');
});

exports.delete = catchAsync(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.author.toString() !== req.user._id.toString()) throw ApiError.forbidden('You can only delete your own comments');
  await Comment.deleteMany({ parentComment: comment._id });
  await comment.deleteOne();
  ApiResponse.success(res, null, 'Comment deleted');
});
