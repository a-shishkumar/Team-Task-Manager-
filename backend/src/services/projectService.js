const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const QueryBuilder = require('../utils/QueryBuilder');

class ProjectService {
  /**
   * Create a new project
   */
  async create(projectData, userId) {
    const project = await Project.create({
      ...projectData,
      owner: userId,
    });

    // Log activity
    await ActivityLog.create({
      user: userId,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
      details: { projectName: project.name },
    });

    return project.populate('owner', 'name email avatar');
  }

  /**
   * Get all projects for a user (owned + member of)
   */
  async getAll(query, userId) {
    // Find projects where user has assigned tasks
    const assignedTaskProjects = await Task.distinct('project', { assignee: userId });

    const filter = {
      $or: [
        { owner: userId },
        { 'members.user': userId },
        { _id: { $in: assignedTaskProjects } },
      ],
      isArchived: query.archived === 'true' ? true : false,
    };

    // Apply status filter
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    // Apply search filter using $and to avoid $or conflict
    if (query.search || query.q) {
      const searchTerm = query.search || query.q;
      const searchRegex = new RegExp(searchTerm, 'i');
      filter.$and = [
        { $or: [{ name: searchRegex }, { description: searchRegex }] },
      ];
    }

    const builder = new QueryBuilder(
      Project.find(filter)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar'),
      query
    );

    builder.sort().selectFields().paginate();

    const projects = await builder.query;
    const pagination = await builder.getPaginationInfo(Project, filter);

    return { projects, pagination };
  }

  /**
   * Get project by ID
   */
  async getById(projectId, userId) {
    const project = await Project.findById(projectId)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role');

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check access
    if (!project.isMember(userId)) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    return project;
  }

  /**
   * Update project
   */
  async update(projectId, updateData, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');

    // Only owner or admin can update
    if (project.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the project owner can update this project');
    }

    Object.assign(project, updateData);
    await project.save();

    await ActivityLog.create({
      user: userId,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
      details: { changes: Object.keys(updateData) },
    });

    return project.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
    ]);
  }

  /**
   * Delete project
   */
  async delete(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');

    if (project.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the project owner can delete this project');
    }

    // Delete all related tasks
    await Task.deleteMany({ project: projectId });

    await project.deleteOne();

    await ActivityLog.create({
      user: userId,
      action: 'deleted',
      entityType: 'project',
      entityId: projectId,
      details: { projectName: project.name },
    });

    return project;
  }

  /**
   * Archive/Unarchive project
   */
  async toggleArchive(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');

    if (project.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the project owner can archive this project');
    }

    project.isArchived = !project.isArchived;
    project.status = project.isArchived ? 'archived' : 'planning';
    await project.save();

    await ActivityLog.create({
      user: userId,
      action: project.isArchived ? 'archived' : 'restored',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
    });

    return project;
  }

  /**
   * Add member to project
   */
  async addMember(projectId, memberUserId, role, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');

    if (project.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the project owner can add members');
    }

    // Check if already a member
    const existingMember = project.members.find(
      (m) => m.user.toString() === memberUserId
    );
    if (existingMember) {
      throw ApiError.conflict('User is already a member of this project');
    }

    project.members.push({ user: memberUserId, role });
    await project.save();

    // Notify the new member
    await Notification.create({
      recipient: memberUserId,
      sender: userId,
      type: 'project_invitation',
      title: 'Project Invitation',
      message: `You have been added to project "${project.name}"`,
      link: `/projects/${project._id}`,
      relatedProject: project._id,
    });

    await ActivityLog.create({
      user: userId,
      action: 'member_added',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
      details: { memberId: memberUserId, role },
    });

    return project.populate('members.user', 'name email avatar');
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId, memberUserId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');

    if (project.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the project owner can remove members');
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== memberUserId
    );
    await project.save();

    // Unassign removed member from tasks
    await Task.updateMany(
      { project: projectId, assignee: memberUserId },
      { $unset: { assignee: '' } }
    );

    await Notification.create({
      recipient: memberUserId,
      sender: userId,
      type: 'member_removed',
      title: 'Removed from Project',
      message: `You have been removed from project "${project.name}"`,
      relatedProject: project._id,
    });

    return project;
  }

  /**
   * Get project statistics
   */
  async getStats(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');
    if (!project.isMember(userId)) throw ApiError.forbidden('Access denied');

    const [taskStats] = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      tasks: taskStats || { total: 0, todo: 0, inProgress: 0, review: 0, completed: 0, overdue: 0 },
      members: project.members.length + 1,
      progress: project.progress,
    };
  }
}

module.exports = new ProjectService();
