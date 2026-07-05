/**
 * config.js — Centralised configuration for the SE Defense backend.
 * Environment variables are loaded by dotenv in server.js before this runs.
 */

module.exports = {
  PORT: process.env.PORT || 5000,

  NODE_ENV: process.env.NODE_ENV || 'development',

  /** Origins allowed to call this API */
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'chrome-extension://*',     // allows the browser extension
  ],

  /** Risk score thresholds */
  RISK_THRESHOLDS: {
    LOW:    { min: 0,  max: 30, label: 'Low',      color: '#22c55e' },
    MEDIUM: { min: 31, max: 59, label: 'Medium',   color: '#f59e0b' },
    HIGH:   { min: 60, max: 79, label: 'High',     color: '#f97316' },
    CRITICAL:{ min: 80, max: 100, label: 'Critical', color: '#ef4444' },
  },

  /** Weights used by the risk calculator */
  SCORE_WEIGHTS: {
    keyword:   0.35,
    url:       0.30,
    sentiment: 0.20,
    sensitive: 0.15,
  },
};
