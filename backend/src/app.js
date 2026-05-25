const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initializeSocket } = require('./sockets/socketHandler');
const swaggerSpec = require('./docs/swagger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'], credentials: true },
});
initializeSocket(io);

// Make io accessible to controllers
app.set('io', io);

// ━━━ Security Middleware ━━━
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(mongoSanitize());

// ━━━ Rate Limiting ━━━
const limiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, message: { success: false, message: 'Too many requests, please try again later' } });
app.use('/api/', limiter);

// Auth-specific stricter rate limit
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth attempts, please try again later' } });
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/signup', authLimiter);

// ━━━ Body Parsing ━━━
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ━━━ Logging ━━━
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// ━━━ API Routes ━━━
const apiPrefix = `/api/${config.apiVersion}`;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/projects`, projectRoutes);
app.use(`${apiPrefix}/tasks`, taskRoutes);
app.use(`${apiPrefix}/comments`, commentRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);

// ━━━ Swagger Docs ━━━
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'TTM API Docs' }));

// ━━━ Health Check ━━━
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running', timestamp: new Date().toISOString(), environment: config.env });
});

// ━━━ Error Handling ━━━
app.use(notFound);
app.use(errorHandler);

// ━━━ Start Server ━━━
const startServer = async () => {
  await connectDB();
  server.listen(config.port, () => {
    logger.info(`🚀 Server running in ${config.env} mode on port ${config.port}`);
    logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
  });
};

startServer();

module.exports = { app, server };
