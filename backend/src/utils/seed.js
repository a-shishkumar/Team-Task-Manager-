const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/team-task-manager');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({}), Comment.deleteMany({}), Notification.deleteMany({}), ActivityLog.deleteMany({})]);

    // Create users
    const users = await User.create([
      { name: 'Admin User', email: 'admin@ttm.com', password: 'Admin@123', role: 'admin', isEmailVerified: true, department: 'Engineering', title: 'CTO' },
      { name: 'Sarah Johnson', email: 'sarah@ttm.com', password: 'Member@123', role: 'member', isEmailVerified: true, department: 'Design', title: 'Lead Designer' },
      { name: 'Mike Chen', email: 'mike@ttm.com', password: 'Member@123', role: 'member', isEmailVerified: true, department: 'Engineering', title: 'Senior Developer' },
      { name: 'Emily Davis', email: 'emily@ttm.com', password: 'Member@123', role: 'member', isEmailVerified: true, department: 'Marketing', title: 'Marketing Manager' },
      { name: 'James Wilson', email: 'james@ttm.com', password: 'Member@123', role: 'member', isEmailVerified: true, department: 'Engineering', title: 'Full Stack Developer' },
    ]);

    console.log(`Created ${users.length} users`);

    // Create projects
    const projects = await Project.create([
      { name: 'E-Commerce Platform', description: 'Build a scalable e-commerce platform', status: 'active', priority: 'high', owner: users[0]._id, members: [{ user: users[1]._id, role: 'lead' }, { user: users[2]._id, role: 'member' }, { user: users[4]._id, role: 'member' }], deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), color: '#667eea', tags: ['react', 'node', 'mongodb'] },
      { name: 'Mobile App Redesign', description: 'Redesign the mobile app UI/UX', status: 'active', priority: 'medium', owner: users[0]._id, members: [{ user: users[1]._id, role: 'lead' }, { user: users[3]._id, role: 'member' }], deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), color: '#f093fb', tags: ['design', 'mobile', 'ux'] },
      { name: 'API Integration', description: 'Integrate third-party APIs', status: 'planning', priority: 'critical', owner: users[2]._id, members: [{ user: users[0]._id, role: 'member' }, { user: users[4]._id, role: 'lead' }], deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), color: '#4facfe', tags: ['api', 'integration'] },
    ]);

    console.log(`Created ${projects.length} projects`);

    // Create tasks
    const tasks = await Task.create([
      { title: 'Setup project repository', description: 'Initialize Git repo and CI/CD pipeline', project: projects[0]._id, status: 'completed', priority: 'high', assignee: users[2]._id, reporter: users[0]._id, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), order: 0, completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { title: 'Design database schema', description: 'Design MongoDB schema for products, orders, users', project: projects[0]._id, status: 'completed', priority: 'high', assignee: users[2]._id, reporter: users[0]._id, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), order: 1, completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { title: 'Build product catalog API', description: 'REST API for CRUD operations on products', project: projects[0]._id, status: 'in-progress', priority: 'high', assignee: users[4]._id, reporter: users[0]._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), order: 0, tags: ['api', 'backend'] },
      { title: 'Create checkout flow UI', description: 'Design and implement the checkout experience', project: projects[0]._id, status: 'todo', priority: 'medium', assignee: users[1]._id, reporter: users[0]._id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), order: 0, tags: ['frontend', 'ui'] },
      { title: 'Implement payment gateway', description: 'Integrate Stripe payment processing', project: projects[0]._id, status: 'todo', priority: 'critical', assignee: users[2]._id, reporter: users[0]._id, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), order: 1, tags: ['payments', 'integration'] },
      { title: 'User research analysis', description: 'Analyze user feedback and create personas', project: projects[1]._id, status: 'review', priority: 'high', assignee: users[1]._id, reporter: users[0]._id, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), order: 0, tags: ['research', 'ux'] },
      { title: 'Create wireframes', description: 'Low-fidelity wireframes for all screens', project: projects[1]._id, status: 'in-progress', priority: 'medium', assignee: users[1]._id, reporter: users[0]._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), order: 0, tags: ['design'] },
      { title: 'API documentation', description: 'Write comprehensive API docs', project: projects[2]._id, status: 'todo', priority: 'medium', assignee: users[4]._id, reporter: users[2]._id, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), order: 0, tags: ['docs'] },
      { title: 'Security audit', description: 'Review all API endpoints for vulnerabilities', project: projects[0]._id, status: 'todo', priority: 'critical', assignee: users[2]._id, reporter: users[0]._id, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), order: 2, tags: ['security'] },
    ]);

    console.log(`Created ${tasks.length} tasks`);

    // Create comments
    await Comment.create([
      { content: 'Great progress on this! The schema looks solid.', task: tasks[1]._id, author: users[0]._id },
      { content: 'I think we should add indexing for the search queries.', task: tasks[1]._id, author: users[4]._id },
      { content: 'Working on the product listing endpoint now.', task: tasks[2]._id, author: users[4]._id },
    ]);

    console.log('✅ Seed data created successfully');
    console.log('\n📧 Login credentials:');
    console.log('  Admin: admin@ttm.com / Admin@123');
    console.log('  Member: sarah@ttm.com / Member@123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
