const express = require('express');
const router = express.Router();
const { analyzeText, getHistory } = require('../controllers/analyzeController');

/**
 * POST /api/analyze
 * Body: { text: string }
 * Returns full threat analysis report.
 */
router.post('/analyze', analyzeText);

/**
 * GET /api/history
 * Returns the last N analyses (in-memory store — demo only).
 */
router.get('/history', getHistory);

module.exports = router;
