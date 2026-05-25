const projectService = require('../services/projectService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.create = catchAsync(async (req, res) => {
  const project = await projectService.create(req.body, req.user._id);
  ApiResponse.created(res, { project });
});

exports.getAll = catchAsync(async (req, res) => {
  const { projects, pagination } = await projectService.getAll(req.query, req.user._id);
  ApiResponse.paginated(res, projects, pagination);
});

exports.getById = catchAsync(async (req, res) => {
  const project = await projectService.getById(req.params.id, req.user._id);
  ApiResponse.success(res, { project });
});

exports.update = catchAsync(async (req, res) => {
  const project = await projectService.update(req.params.id, req.body, req.user._id);
  ApiResponse.success(res, { project }, 'Project updated');
});

exports.delete = catchAsync(async (req, res) => {
  await projectService.delete(req.params.id, req.user._id);
  ApiResponse.success(res, null, 'Project deleted');
});

exports.toggleArchive = catchAsync(async (req, res) => {
  const project = await projectService.toggleArchive(req.params.id, req.user._id);
  ApiResponse.success(res, { project }, project.isArchived ? 'Project archived' : 'Project restored');
});

exports.addMember = catchAsync(async (req, res) => {
  const project = await projectService.addMember(req.params.id, req.body.userId, req.body.role, req.user._id);
  ApiResponse.success(res, { project }, 'Member added');
});

exports.removeMember = catchAsync(async (req, res) => {
  const project = await projectService.removeMember(req.params.id, req.params.userId, req.user._id);
  ApiResponse.success(res, { project }, 'Member removed');
});

exports.getStats = catchAsync(async (req, res) => {
  const stats = await projectService.getStats(req.params.id, req.user._id);
  ApiResponse.success(res, { stats });
});
