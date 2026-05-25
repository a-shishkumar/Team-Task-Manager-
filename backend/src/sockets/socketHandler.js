const User = require('../models/User');
const logger = require('../utils/logger');

const onlineUsers = new Map();

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // User joins
    socket.on('user:online', async (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Join project room
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    // Leave project room
    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Task update broadcast
    socket.on('task:updated', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    // Task created broadcast
    socket.on('task:created', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:created', data);
    });

    // Task deleted broadcast
    socket.on('task:deleted', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:deleted', data);
    });

    // Task reordered (kanban drag & drop)
    socket.on('task:reordered', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:reordered', data);
    });

    // Comment added
    socket.on('comment:added', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:added', data);
    });

    // Notification
    socket.on('notification:send', (data) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification:new', data.notification);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      let disconnectedUserId;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false, lastSeen: new Date() });
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
