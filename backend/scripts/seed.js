const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://ashishkr0727:ashish11@cluster0.w66ll.mongodb.net/team-task-manager?retryWrites=true&w=majority&appName=Cluster0';

// ━━━ Inline Schemas (to avoid config/env dependencies) ━━━
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false }, avatar: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  department: { type: String, default: '' }, title: { type: String, default: '' }, phone: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: true }, isActive: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false }, lastSeen: { type: Date, default: Date.now },
  refreshTokens: [{ token: String, expiresAt: Date, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
userSchema.virtual('avatarUrl').get(function () {
  return this.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=0d9488&color=fff&size=200`;
});

const projectSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, description: { type: String, default: '' },
  status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed', 'archived'], default: 'active' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'member' }, joinedAt: { type: Date, default: Date.now } }],
  startDate: { type: Date, default: Date.now }, deadline: Date, tags: [String],
  color: { type: String, default: '#0d9488' }, progress: { type: Number, default: 0 }, isArchived: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
projectSchema.virtual('memberCount').get(function () { return this.members ? this.members.length + 1 : 1; });

const taskSchema = new mongoose.Schema({
  title: String, description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  status: { type: String, enum: ['todo', 'in-progress', 'review', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date, tags: [String], order: { type: Number, default: 0 },
  completedAt: Date, estimatedHours: Number, actualHours: Number,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
taskSchema.virtual('isOverdue').get(function () { return this.dueDate && new Date() > this.dueDate && this.status !== 'completed'; });

const commentSchema = new mongoose.Schema({
  content: String, task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isEdited: { type: Boolean, default: false }, parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['task_assigned','task_updated','task_completed','task_comment','project_invitation','project_update','member_added','member_removed','deadline_reminder','mention','system'] },
  title: String, message: String, link: { type: String, default: '' },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, enum: ['created','updated','deleted','archived','restored','assigned','unassigned','status_changed','priority_changed','member_added','member_removed','comment_added','attachment_added','attachment_removed','logged_in','logged_out'] },
  entityType: { type: String, enum: ['project', 'task', 'comment', 'user', 'system'] },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// ━━━ Helpers ━━━
const days = (n) => new Date(Date.now() + n * 86400000);
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to', MONGO_URI);

  // Clear all collections
  console.log('🗑️  Clearing existing data...');
  await Promise.all([User.deleteMany(), Project.deleteMany(), Task.deleteMany(), Comment.deleteMany(), Notification.deleteMany(), ActivityLog.deleteMany()]);

  // ━━━ 1. USERS ━━━
  console.log('👤 Creating users...');
  const commonPassword = await bcrypt.hash('Test@123', 12);

  const users = await User.insertMany([
    { name: 'Ashish Kumar', email: 'admin@ttm.com', password: commonPassword, role: 'admin', department: 'Engineering', title: 'CTO', phone: '+91-9876543210', isEmailVerified: true },
    { name: 'Sarah Johnson', email: 'sarah@ttm.com', password: commonPassword, role: 'member', department: 'Design', title: 'UI/UX Lead', phone: '+91-9876543211', isEmailVerified: true },
    { name: 'Rahul Sharma', email: 'rahul@ttm.com', password: commonPassword, role: 'member', department: 'Engineering', title: 'Full Stack Developer', phone: '+91-9876543212', isEmailVerified: true },
    { name: 'Priya Patel', email: 'priya@ttm.com', password: commonPassword, role: 'member', department: 'Product', title: 'Product Manager', phone: '+91-9876543213', isEmailVerified: true },
    { name: 'Amit Verma', email: 'amit@ttm.com', password: commonPassword, role: 'member', department: 'Engineering', title: 'Backend Developer', phone: '+91-9876543214', isEmailVerified: true },
    { name: 'Neha Gupta', email: 'neha@ttm.com', password: commonPassword, role: 'member', department: 'QA', title: 'QA Engineer', phone: '+91-9876543215', isEmailVerified: true },
  ]);
  console.log(`   ✅ Created ${users.length} users`);

  const [admin, sarah, rahul, priya, amit, neha] = users;

  // ━━━ 2. PROJECTS ━━━
  console.log('📁 Creating projects...');
  const projects = await Project.insertMany([
    {
      name: 'TaskFlow Platform', slug: slug('TaskFlow Platform'), description: 'Main product - enterprise task management application with real-time collaboration features.',
      status: 'active', priority: 'critical', owner: admin._id, color: '#0d9488',
      members: [{ user: sarah._id, role: 'lead' }, { user: rahul._id, role: 'member' }, { user: priya._id, role: 'member' }, { user: amit._id, role: 'member' }],
      tags: ['react', 'node', 'mongodb'], startDate: days(-30), deadline: days(60), progress: 45,
    },
    {
      name: 'Mobile App v2', slug: slug('Mobile App v2'), description: 'React Native mobile app for iOS and Android platforms with offline support.',
      status: 'planning', priority: 'high', owner: priya._id, color: '#6366f1',
      members: [{ user: rahul._id, role: 'lead' }, { user: sarah._id, role: 'member' }],
      tags: ['react-native', 'mobile', 'ios', 'android'], startDate: days(-10), deadline: days(90), progress: 10,
    },
    {
      name: 'API Gateway Redesign', slug: slug('API Gateway Redesign'), description: 'Redesign the API gateway for improved performance, caching, and rate limiting.',
      status: 'active', priority: 'high', owner: admin._id, color: '#f59e0b',
      members: [{ user: amit._id, role: 'lead' }, { user: rahul._id, role: 'member' }, { user: neha._id, role: 'member' }],
      tags: ['api', 'performance', 'security'], startDate: days(-20), deadline: days(30), progress: 60,
    },
    {
      name: 'Design System', slug: slug('Design System'), description: 'Company-wide design system with reusable components, tokens, and documentation.',
      status: 'active', priority: 'medium', owner: sarah._id, color: '#ec4899',
      members: [{ user: priya._id, role: 'member' }, { user: admin._id, role: 'viewer' }],
      tags: ['design', 'ui', 'components'], startDate: days(-45), deadline: days(15), progress: 75,
    },
    {
      name: 'Analytics Dashboard', slug: slug('Analytics Dashboard'), description: 'Real-time analytics dashboard with custom reports and data visualization.',
      status: 'on-hold', priority: 'low', owner: admin._id, color: '#8b5cf6',
      members: [{ user: priya._id, role: 'lead' }, { user: neha._id, role: 'member' }],
      tags: ['analytics', 'charts', 'reporting'], startDate: days(-5), deadline: days(45), progress: 20,
    },
  ]);
  console.log(`   ✅ Created ${projects.length} projects`);

  const [taskflow, mobileApp, apiGateway, designSystem, analytics] = projects;

  // ━━━ 3. TASKS ━━━
  console.log('📋 Creating tasks...');
  const taskData = [
    // TaskFlow Platform tasks
    { title: 'Implement JWT refresh token rotation', description: 'Add secure token rotation with blacklisting of old tokens.', project: taskflow._id, status: 'completed', priority: 'critical', assignee: amit._id, reporter: admin._id, dueDate: days(-5), order: 0, tags: ['auth', 'security'], estimatedHours: 8 },
    { title: 'Build Kanban board drag-and-drop', description: 'Implement drag-and-drop functionality for the Kanban board using @hello-pangea/dnd.', project: taskflow._id, status: 'in-progress', priority: 'high', assignee: rahul._id, reporter: priya._id, dueDate: days(7), order: 1, tags: ['frontend', 'kanban'], estimatedHours: 16 },
    { title: 'Design notification bell dropdown', description: 'Create the notification dropdown with unread count badge and mark-as-read functionality.', project: taskflow._id, status: 'review', priority: 'medium', assignee: sarah._id, reporter: priya._id, dueDate: days(3), order: 2, tags: ['design', 'ui'], estimatedHours: 6 },
    { title: 'Add real-time Socket.IO events', description: 'Integrate Socket.IO on the frontend to receive live task/project updates.', project: taskflow._id, status: 'todo', priority: 'high', assignee: rahul._id, reporter: admin._id, dueDate: days(14), order: 3, tags: ['websocket', 'real-time'], estimatedHours: 12 },
    { title: 'Write unit tests for auth service', description: 'Cover signup, login, token refresh, and password reset flows.', project: taskflow._id, status: 'todo', priority: 'medium', assignee: neha._id, reporter: admin._id, dueDate: days(10), order: 4, tags: ['testing'], estimatedHours: 10 },
    { title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment to staging.', project: taskflow._id, status: 'todo', priority: 'low', assignee: amit._id, reporter: admin._id, dueDate: days(21), order: 5, tags: ['devops', 'ci-cd'], estimatedHours: 8 },
    // Mobile App tasks
    { title: 'Setup React Native project', description: 'Initialize project with Expo and configure navigation structure.', project: mobileApp._id, status: 'completed', priority: 'high', assignee: rahul._id, reporter: priya._id, dueDate: days(-2), order: 0, tags: ['setup'], estimatedHours: 4 },
    { title: 'Design mobile login screens', description: 'Create mobile-optimized login and signup screens matching the web design system.', project: mobileApp._id, status: 'in-progress', priority: 'high', assignee: sarah._id, reporter: priya._id, dueDate: days(5), order: 1, tags: ['design', 'mobile'], estimatedHours: 8 },
    { title: 'Implement offline data sync', description: 'Add offline-first architecture with background sync when connection restores.', project: mobileApp._id, status: 'todo', priority: 'critical', assignee: rahul._id, reporter: priya._id, dueDate: days(30), order: 2, tags: ['offline', 'sync'], estimatedHours: 24 },
    // API Gateway tasks
    { title: 'Implement Redis caching layer', description: 'Add Redis caching for frequently accessed API endpoints.', project: apiGateway._id, status: 'completed', priority: 'critical', assignee: amit._id, reporter: admin._id, dueDate: days(-7), order: 0, tags: ['redis', 'caching'], estimatedHours: 12 },
    { title: 'Add request rate limiting', description: 'Implement sliding window rate limiting per user and IP.', project: apiGateway._id, status: 'completed', priority: 'high', assignee: amit._id, reporter: admin._id, dueDate: days(-3), order: 1, tags: ['security', 'rate-limit'], estimatedHours: 6 },
    { title: 'Load testing with k6', description: 'Write and run k6 load test scripts for all critical endpoints.', project: apiGateway._id, status: 'in-progress', priority: 'medium', assignee: neha._id, reporter: amit._id, dueDate: days(5), order: 2, tags: ['testing', 'performance'], estimatedHours: 10 },
    { title: 'API versioning strategy', description: 'Implement URL-based API versioning with deprecation headers.', project: apiGateway._id, status: 'todo', priority: 'medium', assignee: amit._id, reporter: admin._id, dueDate: days(15), order: 3, tags: ['api', 'versioning'], estimatedHours: 8 },
    // Design System tasks
    { title: 'Create Button component variants', description: 'Build all button variants: primary, secondary, outline, ghost, destructive.', project: designSystem._id, status: 'completed', priority: 'high', assignee: sarah._id, reporter: sarah._id, dueDate: days(-10), order: 0, tags: ['component'], estimatedHours: 6 },
    { title: 'Build Card and Dialog components', description: 'Create accessible Card and Dialog components with animations.', project: designSystem._id, status: 'completed', priority: 'high', assignee: sarah._id, reporter: priya._id, dueDate: days(-5), order: 1, tags: ['component'], estimatedHours: 8 },
    { title: 'Write Storybook documentation', description: 'Document all components in Storybook with usage examples and props table.', project: designSystem._id, status: 'in-progress', priority: 'medium', assignee: sarah._id, reporter: priya._id, dueDate: days(8), order: 2, tags: ['docs', 'storybook'], estimatedHours: 12 },
    { title: 'Dark mode token audit', description: 'Audit all color tokens to ensure proper contrast ratios in dark mode.', project: designSystem._id, status: 'review', priority: 'medium', assignee: sarah._id, reporter: admin._id, dueDate: days(3), order: 3, tags: ['a11y', 'dark-mode'], estimatedHours: 4 },
    // Analytics tasks
    { title: 'Define analytics data models', description: 'Design MongoDB schemas for analytics events and aggregations.', project: analytics._id, status: 'completed', priority: 'high', assignee: amit._id, reporter: priya._id, dueDate: days(-1), order: 0, tags: ['data', 'schema'], estimatedHours: 6 },
    { title: 'Build chart components', description: 'Create reusable chart components using Recharts for bar, line, pie, and area charts.', project: analytics._id, status: 'todo', priority: 'medium', assignee: rahul._id, reporter: priya._id, dueDate: days(20), order: 1, tags: ['charts', 'frontend'], estimatedHours: 16 },
    // Overdue task for dashboard
    { title: 'Fix production memory leak', description: 'Investigate and fix the memory leak reported in production Node.js process.', project: taskflow._id, status: 'in-progress', priority: 'critical', assignee: amit._id, reporter: admin._id, dueDate: days(-3), order: 6, tags: ['bug', 'production'], estimatedHours: 8 },
  ];

  const tasks = await Task.insertMany(taskData);
  console.log(`   ✅ Created ${tasks.length} tasks`);

  // Update project progress based on actual task completion
  for (const proj of projects) {
    const projectTasks = tasks.filter(t => t.project.toString() === proj._id.toString());
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
    await Project.findByIdAndUpdate(proj._id, { progress });
  }
  console.log('   ✅ Updated project progress');

  // ━━━ 4. COMMENTS ━━━
  console.log('💬 Creating comments...');
  const comments = await Comment.insertMany([
    { content: 'Token rotation is implemented. Ready for code review.', task: tasks[0]._id, author: amit._id },
    { content: 'Looks good! Merging to main.', task: tasks[0]._id, author: admin._id },
    { content: 'The drag-and-drop is mostly working. Need to fix the animation lag on mobile.', task: tasks[1]._id, author: rahul._id },
    { content: 'Can we add a visual indicator for the drop zone?', task: tasks[1]._id, author: sarah._id },
    { content: 'Notification dropdown mockup is ready for review. Check Figma link in the task.', task: tasks[2]._id, author: sarah._id },
    { content: 'Redis caching reduced API response time by 60%. Great work!', task: tasks[9]._id, author: admin._id },
    { content: 'Memory leak seems related to uncleared intervals in the socket handler. Investigating.', task: tasks[19]._id, author: amit._id },
  ]);
  console.log(`   ✅ Created ${comments.length} comments`);

  // ━━━ 5. NOTIFICATIONS ━━━
  console.log('🔔 Creating notifications...');
  const notifications = await Notification.insertMany([
    { recipient: admin._id, sender: amit._id, type: 'task_completed', title: 'Task Completed', message: 'Amit completed "Implement JWT refresh token rotation"', link: '/tasks', relatedProject: taskflow._id, relatedTask: tasks[0]._id },
    { recipient: admin._id, sender: neha._id, type: 'task_comment', title: 'New Comment', message: 'Neha commented on "Write unit tests for auth service"', link: '/tasks', relatedTask: tasks[4]._id },
    { recipient: sarah._id, sender: priya._id, type: 'task_assigned', title: 'Task Assigned', message: 'You have been assigned "Design mobile login screens"', link: '/tasks', relatedProject: mobileApp._id, relatedTask: tasks[7]._id },
    { recipient: rahul._id, sender: admin._id, type: 'task_assigned', title: 'Task Assigned', message: 'You have been assigned "Build Kanban board drag-and-drop"', link: '/tasks', relatedProject: taskflow._id, relatedTask: tasks[1]._id },
    { recipient: amit._id, sender: admin._id, type: 'deadline_reminder', title: 'Deadline Approaching', message: '"Fix production memory leak" is overdue!', link: '/tasks', relatedTask: tasks[19]._id },
    { recipient: admin._id, sender: sarah._id, type: 'task_updated', title: 'Task Updated', message: 'Sarah moved "Dark mode token audit" to Review', link: '/tasks', relatedTask: tasks[16]._id, isRead: true },
    { recipient: priya._id, sender: admin._id, type: 'project_update', title: 'Project Updated', message: 'TaskFlow Platform progress updated to 45%', link: '/projects', relatedProject: taskflow._id, isRead: true },
  ]);
  console.log(`   ✅ Created ${notifications.length} notifications`);

  // ━━━ 6. ACTIVITY LOG ━━━
  console.log('📊 Creating activity logs...');
  const activityLogs = await ActivityLog.insertMany([
    { user: admin._id, action: 'created', entityType: 'project', entityId: taskflow._id, project: taskflow._id, details: { projectName: 'TaskFlow Platform' } },
    { user: amit._id, action: 'status_changed', entityType: 'task', entityId: tasks[0]._id, project: taskflow._id, details: { taskTitle: 'Implement JWT refresh token rotation', from: 'in-progress', to: 'completed' } },
    { user: rahul._id, action: 'updated', entityType: 'task', entityId: tasks[1]._id, project: taskflow._id, details: { taskTitle: 'Build Kanban board drag-and-drop' } },
    { user: sarah._id, action: 'status_changed', entityType: 'task', entityId: tasks[16]._id, project: designSystem._id, details: { taskTitle: 'Dark mode token audit', from: 'in-progress', to: 'review' } },
    { user: admin._id, action: 'member_added', entityType: 'project', entityId: apiGateway._id, project: apiGateway._id, details: { projectName: 'API Gateway Redesign', memberName: 'Neha Gupta' } },
    { user: amit._id, action: 'comment_added', entityType: 'task', entityId: tasks[19]._id, project: taskflow._id, details: { taskTitle: 'Fix production memory leak' } },
    { user: priya._id, action: 'created', entityType: 'project', entityId: mobileApp._id, project: mobileApp._id, details: { projectName: 'Mobile App v2' } },
    { user: sarah._id, action: 'created', entityType: 'task', entityId: tasks[13]._id, project: designSystem._id, details: { taskTitle: 'Create Button component variants' } },
  ]);
  console.log(`   ✅ Created ${activityLogs.length} activity logs`);

  // ━━━ Summary ━━━
  console.log('\n🎉 ━━━ SEED COMPLETE ━━━');
  console.log(`   👤 Users:         ${users.length}`);
  console.log(`   📁 Projects:      ${projects.length}`);
  console.log(`   📋 Tasks:         ${tasks.length}`);
  console.log(`   💬 Comments:      ${comments.length}`);
  console.log(`   🔔 Notifications: ${notifications.length}`);
  console.log(`   📊 Activity Logs: ${activityLogs.length}`);
  console.log('\n━━━ LOGIN CREDENTIALS ━━━');
  console.log('   Admin:  admin@ttm.com  / Test@123');
  console.log('   Member: sarah@ttm.com  / Test@123');
  console.log('   Member: rahul@ttm.com  / Test@123');
  console.log('   Member: priya@ttm.com  / Test@123');
  console.log('   Member: amit@ttm.com   / Test@123');
  console.log('   Member: neha@ttm.com   / Test@123');

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB. Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
