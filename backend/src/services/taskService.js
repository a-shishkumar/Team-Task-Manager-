const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const QueryBuilder = require('../utils/QueryBuilder');

class TaskService {
  async create(taskData, userId) {
    const project = await Project.findById(taskData.project);
    if (!project) throw ApiError.notFound('Project not found');
    if (!project.isMember(userId)) throw ApiError.forbidden('Access denied');

    const lastTask = await Task.findOne({ project: taskData.project, status: taskData.status || 'todo' }).sort({ order: -1 });

    const task = await Task.create({ ...taskData, reporter: userId, order: lastTask ? lastTask.order + 1 : 0 });

    if (taskData.assignee && taskData.assignee !== userId.toString()) {
      await Notification.create({ recipient: taskData.assignee, sender: userId, type: 'task_assigned', title: 'New Task Assigned', message: `You have been assigned "${task.title}" in "${project.name}"`, link: `/projects/${project._id}/tasks/${task._id}`, relatedProject: project._id, relatedTask: task._id });
    }

    await ActivityLog.create({ user: userId, action: 'created', entityType: 'task', entityId: task._id, project: project._id, details: { taskTitle: task.title } });
    await this._updateProjectProgress(project._id);

    return task.populate([{ path: 'assignee', select: 'name email avatar' }, { path: 'reporter', select: 'name email avatar' }, { path: 'project', select: 'name color' }]);
  }

  async getAll(query, userId) {
    const filter = {};
    if (query.project) {
      const project = await Project.findById(query.project);
      if (!project) throw ApiError.notFound('Project not found');
      if (!project.isMember(userId)) throw ApiError.forbidden('Access denied');
      filter.project = query.project;
    } else {
      const projects = await Project.find({ $or: [{ owner: userId }, { 'members.user': userId }] }).select('_id');
      filter.project = { $in: projects.map((p) => p._id) };
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignee) filter.assignee = query.assignee;
    if (query.assignedToMe === 'true') filter.assignee = userId;
    if (query.overdue === 'true') { filter.dueDate = { $lt: new Date() }; filter.status = { $ne: 'completed' }; }

    const builder = new QueryBuilder(Task.find(filter).populate('assignee', 'name email avatar').populate('reporter', 'name email avatar').populate('project', 'name color'), query);
    builder.search(['title', 'description']).sort().selectFields().paginate();
    const tasks = await builder.query;
    const pagination = await builder.getPaginationInfo(Task, filter);
    return { tasks, pagination };
  }

  async getById(taskId, userId) {
    const task = await Task.findById(taskId).populate('assignee', 'name email avatar').populate('reporter', 'name email avatar').populate('project', 'name color members owner');
    if (!task) throw ApiError.notFound('Task not found');
    const project = await Project.findById(task.project._id || task.project);
    if (!project.isMember(userId)) throw ApiError.forbidden('Access denied');
    return task;
  }

  async update(taskId, updateData, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw ApiError.notFound('Task not found');
    const project = await Project.findById(task.project);
    if (!project.isMember(userId)) throw ApiError.forbidden('Access denied');
    const oldStatus = task.status;
    Object.assign(task, updateData);
    await task.save();

    if (updateData.status && updateData.status !== oldStatus) {
      const notifyUsers = [task.reporter?.toString(), task.assignee?.toString()].filter((id) => id && id !== userId.toString());
      for (const rid of notifyUsers) {
        await Notification.create({ recipient: rid, sender: userId, type: 'task_updated', title: 'Task Updated', message: `"${task.title}" moved to ${updateData.status}`, relatedProject: project._id, relatedTask: task._id });
      }
    }
    if (updateData.assignee && updateData.assignee !== task.assignee?.toString()) {
      await Notification.create({ recipient: updateData.assignee, sender: userId, type: 'task_assigned', title: 'Task Assigned', message: `You have been assigned "${task.title}"`, relatedProject: project._id, relatedTask: task._id });
    }

    await ActivityLog.create({ user: userId, action: updateData.status !== oldStatus ? 'status_changed' : 'updated', entityType: 'task', entityId: task._id, project: project._id, details: { taskTitle: task.title, changes: Object.keys(updateData) } });
    await this._updateProjectProgress(project._id);
    return task.populate([{ path: 'assignee', select: 'name email avatar' }, { path: 'reporter', select: 'name email avatar' }, { path: 'project', select: 'name color' }]);
  }

  async delete(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw ApiError.notFound('Task not found');
    const project = await Project.findById(task.project);
    if (project.owner.toString() !== userId.toString() && task.reporter.toString() !== userId.toString()) throw ApiError.forbidden('Permission denied');
    await task.deleteOne();
    await this._updateProjectProgress(project._id);
    return task;
  }

  async updateOrder(tasks) {
    const bulkOps = tasks.map(({ id, status, order }) => ({ updateOne: { filter: { _id: id }, update: { $set: { status, order } } } }));
    await Task.bulkWrite(bulkOps);
    const projectIds = await Task.find({ _id: { $in: tasks.map((t) => t.id) } }).distinct('project');
    for (const pid of projectIds) await this._updateProjectProgress(pid);
    return true;
  }

  async getKanbanTasks(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');
    if (!project.isMember(userId)) throw ApiError.forbidden('Access denied');
    const tasks = await Task.find({ project: projectId }).populate('assignee', 'name email avatar').populate('reporter', 'name email avatar').sort({ order: 1 });
    return { todo: tasks.filter((t) => t.status === 'todo'), 'in-progress': tasks.filter((t) => t.status === 'in-progress'), review: tasks.filter((t) => t.status === 'review'), completed: tasks.filter((t) => t.status === 'completed') };
  }

  async _updateProjectProgress(projectId) {
    const [stats] = await Task.aggregate([{ $match: { project: projectId } }, { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }]);
    const progress = stats ? Math.round((stats.completed / stats.total) * 100) : 0;
    await Project.findByIdAndUpdate(projectId, { progress });
  }
}

module.exports = new TaskService();
