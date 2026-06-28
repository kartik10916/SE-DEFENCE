const keywordDetector  = require('../services/keywordDetector');
const urlDetector      = require('../services/urlDetector');
const sentimentDetector = require('../services/sentimentDetector');
const riskCalculator   = require('../services/riskCalculator');
const explanationEngine = require('../services/explanationEngine');

/** In-memory history store (max 50 entries — demo only). */
const analysisHistory = [];

/**
 * POST /api/analyze
 */
const analyzeText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Request body must contain a non-empty "text" string.',
      });
    }

    const trimmed = text.trim();
    if (trimmed.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Text is too short to analyze (minimum 5 characters).',
      });
    }

    // ── Run all detection services in parallel ──────────────────────────────
    const [keywordResult, urlResult, sentimentResult] = await Promise.all([
      keywordDetector.analyze(trimmed),
      urlDetector.analyze(trimmed),
      sentimentDetector.analyze(trimmed),
    ]);

    // ── Calculate composite risk score ──────────────────────────────────────
    const riskResult = riskCalculator.calculate({
      keywordResult,
      urlResult,
      sentimentResult,
    });

    // ── Build human-readable explanation ───────────────────────────────────
    const explanation = explanationEngine.build({
      keywordResult,
      urlResult,
      sentimentResult,
      riskResult,
    });

    const report = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      inputLength: trimmed.length,
      riskScore:   riskResult.score,
      riskLevel:   riskResult.level,
      riskColor:   riskResult.color,
      attackTypes: riskResult.attackTypes,
      keywords:    keywordResult,
      urls:        urlResult,
      sentiment:   sentimentResult,
      explanation,
      highlights:  buildHighlights(trimmed, keywordResult, urlResult),
    };

    // ── Store in history ────────────────────────────────────────────────────
    analysisHistory.unshift({ ...report, inputPreview: trimmed.slice(0, 120) });
    if (analysisHistory.length > 50) analysisHistory.pop();

    return res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/history
 */
const getHistory = (_req, res) => {
  res.json({ success: true, count: analysisHistory.length, history: analysisHistory });
};

/**
 * Build character-level highlight ranges for the frontend.
 */
function buildHighlights(text, keywordResult, urlResult) {
  const highlights = [];
  const lower = text.toLowerCase();

  const addHighlight = (term, type, severity) => {
    let idx = lower.indexOf(term.toLowerCase());
    while (idx !== -1) {
      highlights.push({ start: idx, end: idx + term.length, term, type, severity });
      idx = lower.indexOf(term.toLowerCase(), idx + 1);
    }
  };

  (keywordResult.suspiciousKeywords || []).forEach(k => addHighlight(k, 'suspicious', 'high'));
  (keywordResult.urgencyKeywords   || []).forEach(k => addHighlight(k, 'urgency',    'medium'));
  (keywordResult.authorityKeywords || []).forEach(k => addHighlight(k, 'authority',  'medium'));
  (keywordResult.sensitiveKeywords || []).forEach(k => addHighlight(k, 'sensitive',  'low'));
  (urlResult.suspiciousUrls        || []).forEach(u => addHighlight(u.url, 'url', 'high'));

  return highlights;
}

module.exports = { analyzeText, getHistory };
