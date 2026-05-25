const taskService = require('../services/taskService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.create = catchAsync(async (req, res) => {
  const task = await taskService.create(req.body, req.user._id);
  ApiResponse.created(res, { task });
});

exports.getAll = catchAsync(async (req, res) => {
  const { tasks, pagination } = await taskService.getAll(req.query, req.user._id);
  ApiResponse.paginated(res, tasks, pagination);
});

exports.getById = catchAsync(async (req, res) => {
  const task = await taskService.getById(req.params.id, req.user._id);
  ApiResponse.success(res, { task });
});

exports.update = catchAsync(async (req, res) => {
  const task = await taskService.update(req.params.id, req.body, req.user._id);
  ApiResponse.success(res, { task }, 'Task updated');
});

exports.delete = catchAsync(async (req, res) => {
  await taskService.delete(req.params.id, req.user._id);
  ApiResponse.success(res, null, 'Task deleted');
});

exports.updateOrder = catchAsync(async (req, res) => {
  await taskService.updateOrder(req.body.tasks);
  ApiResponse.success(res, null, 'Task order updated');
});

exports.getKanban = catchAsync(async (req, res) => {
  const columns = await taskService.getKanbanTasks(req.params.projectId, req.user._id);
  ApiResponse.success(res, { columns });
});

// ━━━ Subtask Operations ━━━
exports.addSubtask = catchAsync(async (req, res) => {
  const task = await taskService.getById(req.params.id, req.user._id);
  task.subtasks.push({ title: req.body.title });
  await task.save();
  ApiResponse.created(res, { task });
});

exports.toggleSubtask = catchAsync(async (req, res) => {
  const task = await taskService.getById(req.params.id, req.user._id);
  const sub = task.subtasks.id(req.params.subtaskId);
  if (!sub) throw new Error('Subtask not found');
  sub.isCompleted = !sub.isCompleted;
  sub.completedAt = sub.isCompleted ? new Date() : undefined;
  await task.save();
  ApiResponse.success(res, { task }, 'Subtask updated');
});

exports.deleteSubtask = catchAsync(async (req, res) => {
  const task = await taskService.getById(req.params.id, req.user._id);
  task.subtasks.pull(req.params.subtaskId);
  await task.save();
  ApiResponse.success(res, { task }, 'Subtask removed');
});
