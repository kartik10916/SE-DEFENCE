require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const compression= require('compression');
const morgan     = require('morgan');

const analyzeRoutes = require('./routes/analyzeRoutes');
const errorHandler  = require('./middleware/errorHandler');
const { PORT, ALLOWED_ORIGINS, NODE_ENV } = require('./config/config');

const app = express();
const VERSION = '2.0.0';

// ── Global scan counter (in-memory) ──────────────────────────────────────────
let totalScans = 0;
const scanCounter = {
  get:       () => totalScans,
  increment: () => ++totalScans,
};

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,  // disable for dev
}));
app.use(compression());

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again in 15 minutes.',
  },
});
app.use('/api', limiter);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Expose scan counter to controllers via app.locals ────────────────────────
app.locals.scanCounter = scanCounter;
app.locals.version = VERSION;

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status:  'ok',
    version: VERSION,
    uptime:  Math.round(process.uptime()),
    memory: {
      heapUsed:  `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
      rss:       `${Math.round(mem.rss / 1024 / 1024)} MB`,
    },
    totalScans: scanCounter.get(),
  });
});

// ── Stats endpoint ───────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
  res.json({
    success:    true,
    version:    VERSION,
    totalScans: scanCounter.get(),
    uptime:     Math.round(process.uptime()),
    environment: NODE_ENV,
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', analyzeRoutes);

// ── Error handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  SE Defense API v${VERSION} running on http://localhost:${PORT}`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Stats:   http://localhost:${PORT}/api/stats\n`);
});

module.exports = app;
