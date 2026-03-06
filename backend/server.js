const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const os = require('os');
require('dotenv').config();

const db = require('./src/config/db');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const enhancedSystemMonitor = require('./src/utils/enhancedSystemMonitor');

const app = express(); 

// 🌐 Environment Variables
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST_IP || '0.0.0.0';

// 📊 Dynamic local IP (fallback for console logs)
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';
for (const iface of Object.values(networkInterfaces)) {
  for (const info of iface) {
    if (info.family === 'IPv4' && !info.internal) {
      localIP = info.address;
      break;
    }
  }
}

// 🛡️ Rate Limiter (OPTIONS SAFE)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// =========================
// 🔧 MIDDLEWARE ORDER (CRITICAL)
// =========================

// ✅ CORS MUST BE FIRST
const allowedOrigins = (process.env.CORS_ORIGIN || `http://${localIP}:8800`)
  .split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE',"PATCH", 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Explicit Preflight Support
app.options('*', cors({ origin: (origin, callback) => callback(null, true) }));

// 🛡️ Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// 🛡️ Rate Limiting AFTER CORS
app.use(limiter);

// 🚀 Performance + Logs
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 📦 Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📁 File Uploads
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded'
}));

// 🗂️ Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📡 API Monitoring
app.use('/api', (req, res, next) => {
  enhancedSystemMonitor.incrementApiCall();
  next();
});

// 🧭 API Routes
app.use('/api', routes);

// 🩺 Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Digital Checksheet Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 🏠 Root
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Digital Checksheet Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// ❌ 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// 🧯 Error Handler (LAST)
app.use(errorHandler);

// 🚀 Start Server
const startServer = async () => {
  try {
    if(process.env.AUTO_DB_INIT === "true"){
   await db.initializeDatabase();
}
    await db.executeQuery('SELECT 1');
    console.log('✅ Database connected successfully');

    app.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? localIP : HOST;
      console.log(`🚀 Digital Checksheet Backend running on http://${displayHost}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health: http://${displayHost}:${PORT}/health`);
      console.log(`📚 API: http://${displayHost}:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Server start failed:', error.message);
    process.exit(1);
  }
};

// 🧩 Process Handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {

  if (err.message && err.message.includes('rpc.sock')) {
    console.log('⚠️ Monitor disabled (Windows permission)');
    return;
  }

  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
