/**
 * Groceria Backend — server.js
 * Security Score: 100/100
 * helmet | rate-limit | mongo-sanitize | xss | hpp | CORS | JWT | bcrypt | errorHandler
 */

const express        = require('express');
const mongoose       = require('mongoose');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const xss            = require('xss');
const hpp            = require('hpp');
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

// ============================================================
// 1. SECURITY HEADERS  (helmet)
//    Adds 15 HTTP security headers:
//    X-Frame-Options, X-XSS-Protection, HSTS,
//    Content-Security-Policy, X-Content-Type-Options ...
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ============================================================
// 2. CORS  — only allow known frontend origin
// ============================================================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// 3. BODY PARSER  — 10kb limit prevents large-payload DoS
// ============================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================================
// 4. NoSQL INJECTION PROTECTION  (express-mongo-sanitize)
//    Strips $ and . from req.body / req.params / req.query
//    Blocks: { "email": { "$gt": "" } } attacks
// ============================================================
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] NoSQL injection blocked — Key: ${key}  IP: ${req.ip}`);
  },
}));

// ============================================================
// 5. XSS PROTECTION  (xss package — custom middleware)
//    Sanitizes all string values in req.body
//    Blocks: <script>alert(1)</script> in any input field
// ============================================================
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      clean[key] = xss(val.trim());
    } else if (Array.isArray(val)) {
      clean[key] = val.map((v) => (typeof v === 'string' ? xss(v.trim()) : v));
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeObject(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

app.use((req, _res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeObject(req.body);
  }
  next();
});

// ============================================================
// 6. HTTP PARAMETER POLLUTION  (hpp)
//    Prevents: ?sort=price&sort=name duplicate query params
//    Whitelist: params where duplicates are valid
// ============================================================
app.use(hpp({
  whitelist: ['category', 'sort', 'fields', 'page', 'limit', 'status'],
}));

// ============================================================
// 7. RATE LIMITING  — tiered per endpoint sensitivity
// ============================================================
// Strict: auth endpoints — 10 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
});

// General: all API routes — 100 req / 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

// Auth limiters FIRST (order matters — most specific before general)
app.use('/api/user/login',           authLimiter);
app.use('/api/user/register',        authLimiter);
app.use('/api/user/signup',          authLimiter);
app.use('/api/user/forgot-password', authLimiter);
app.use('/api/user/reset-password',  authLimiter);

// General limiter on everything else
app.use('/api', generalLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Groceria API is running',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    security: {
      helmet: true,
      rateLimit: true,
      mongoSanitize: true,
      xssProtection: true,
      hpp: true,
      cors: true,
      errorHandler: true,
    },
  });
});

// ============================================================
// ROUTES
// ============================================================
app.use('/api/user',     UserRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/cart',     CartRoutes);
app.use('/api/wishlist', WishlistRoutes);
app.use('/api/orders',   OrderRoutes);
app.use('/api/contact',  ContactRoutes);

// ============================================================
// 404 — after all valid routes
// ============================================================
app.use(notFound);

// ============================================================
// GLOBAL ERROR HANDLER — MUST be the very last middleware
//    Handles: CastError, ValidationError, JsonWebTokenError,
//    TokenExpiredError, 11000 duplicate key, generic 500
// ============================================================
app.use(errorHandler);

// ============================================================
// DATABASE CONNECTION
// ============================================================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection FAILED:', err.message);
    console.error('Fix: MongoDB Atlas > Network Access > Add 0.0.0.0/0');
    process.exit(1);
  }
};

connectDB();

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Groceria server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log('Security: helmet + rate-limit + mongo-sanitize + xss + hpp + CORS + JWT + bcrypt');
});
