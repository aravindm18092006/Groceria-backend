/**
 * Groceria Backend  server.js
 * helmet | rate-limit | mongo-sanitize | xss | CORS | JWT | bcrypt | errorHandler
 */

const express        = require('express');
const mongoose       = require('mongoose');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const xss            = require('xss');
require('dotenv').config();
const cors           = require('cors');

const UserRoutes     = require('./Routers/UserRoutes');
const ProductRoutes  = require('./Routers/ProductRoutes');
const CartRoutes     = require('./Routers/CartRoutes');
const WishlistRoutes = require('./Routers/WishlistRoutes');
const OrderRoutes    = require('./Routers/OrderRoutes');
const ContactRoutes  = require('./Routers/ContactRoutes');
const { errorHandler, notFound } = require('./Middleware/errorMiddleware');

const app = express();

// 1. SECURITY HEADERS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. BODY PARSER
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. NoSQL INJECTION PROTECTION
// Express 5: req.query is read-only, so we manually sanitize only req.body and req.params
app.use(function(req, res, next) {
  mongoSanitize.sanitize(req.body,   { replaceWith: '_' });
  mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});

// 5. XSS PROTECTION
const sanitizeObject = function(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      clean[key] = xss(val.trim());
    } else if (Array.isArray(val)) {
      clean[key] = val.map(function(v) { return typeof v === 'string' ? xss(v.trim()) : v; });
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeObject(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

app.use(function(req, res, next) {
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeObject(req.body);
  }
  next();
});

// 6. RATE LIMITING
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts from this IP. Please try again after 15 minutes.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

app.use('/api/user/login',           authLimiter);
app.use('/api/user/register',        authLimiter);
app.use('/api/user/signup',          authLimiter);
app.use('/api/user/forgot-password', authLimiter);
app.use('/api/user/reset-password',  authLimiter);
app.use('/api', generalLimiter);

// HEALTH CHECK
app.get('/api/health', function(req, res) {
  res.status(200).json({
    success: true,
    message: 'Groceria API is running',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ROUTES
app.use('/api/user',     UserRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/cart',     CartRoutes);
app.use('/api/wishlist', WishlistRoutes);
app.use('/api/orders',   OrderRoutes);
app.use('/api/contact',  ContactRoutes);

app.use(notFound);
app.use(errorHandler);

// DATABASE CONNECTION
const connectDB = async function() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log('MongoDB Connected: ' + conn.connection.host);
  } catch (err) {
    console.error('MongoDB connection FAILED:', err.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, function() {
  console.log('Groceria server running on port ' + PORT);
});
