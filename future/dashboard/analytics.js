/**
 * analytics.js — SE Defense Analytics Engine (Future Dashboard)
 *
 * Provides data aggregation, statistics, and trend analysis
 * over the analysis history stored by the backend.
 */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const RISK_LEVELS   = ['Low', 'Medium', 'High', 'Critical'];
const ATTACK_TYPES  = [
  'Phishing', 'Urgency Manipulation', 'Authority Impersonation',
  'Pretexting', 'Coercion / Intimidation', 'Brand Spoofing', 'URL Obfuscation',
];

// ── Core Statistics ───────────────────────────────────────────────────────────

/**
 * Computes aggregate statistics over an array of analysis reports.
 * @param {Array<Object>} reports
 * @returns {Object} summary statistics
 */
function computeStats(reports) {
  if (!reports || reports.length === 0) {
    return { count: 0, avgScore: 0, maxScore: 0, minScore: 0 };
  }

  const scores = reports.map(r => r.riskScore);
  const total  = reports.length;

  const avgScore  = Math.round(scores.reduce((a, b) => a + b, 0) / total);
  const maxScore  = Math.max(...scores);
  const minScore  = Math.min(...scores);
  const highRisk  = reports.filter(r => r.riskScore >= 60).length;
  const threatRate = ((highRisk / total) * 100).toFixed(1);

  return {
    count:      total,
    avgScore,
    maxScore,
    minScore,
    highRisk,
    threatRate: parseFloat(threatRate),
  };
}

/**
 * Groups reports by risk level and returns distribution counts.
 * @param {Array<Object>} reports
 * @returns {Object} { Low: N, Medium: N, High: N, Critical: N }
 */
function getRiskDistribution(reports) {
  const dist = Object.fromEntries(RISK_LEVELS.map(l => [l, 0]));
  reports.forEach(r => {
    if (r.riskLevel in dist) dist[r.riskLevel]++;
  });
  return dist;
}

/**
 * Counts occurrences of each attack type across all reports.
 * @param {Array<Object>} reports
 * @returns {Array<{type: string, count: number}>} sorted by count desc
 */
function getAttackTypeFrequency(reports) {
  const freq = Object.fromEntries(ATTACK_TYPES.map(t => [t, 0]));
  reports.forEach(r => {
    (r.attackTypes || []).forEach(t => {
      if (t in freq) freq[t]++;
    });
  });
  return Object.entries(freq)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Groups reports by date (YYYY-MM-DD) and computes daily average score.
 * @param {Array<Object>} reports
 * @returns {Array<{date: string, avgScore: number, count: number}>}
 */
function getDailyTrend(reports) {
  const byDate = {};
  reports.forEach(r => {
    const date = r.timestamp?.slice(0, 10);
    if (!date) return;
    if (!byDate[date]) byDate[date] = { scores: [], count: 0 };
    byDate[date].scores.push(r.riskScore);
    byDate[date].count++;
  });

  return Object.entries(byDate)
    .map(([date, { scores, count }]) => ({
      date,
      count,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / count),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns the top N most dangerous reports.
 * @param {Array<Object>} reports
 * @param {number} n
 */
function getTopThreats(reports, n = 10) {
  return [...reports]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, n);
}

/**
 * Computes keyword frequency across all reports.
 * @param {Array<Object>} reports
 * @returns {Array<{word: string, count: number}>}
 */
function getKeywordFrequency(reports) {
  const freq = {};
  reports.forEach(r => {
    const allWords = [
      ...(r.keywords?.suspiciousKeywords || []),
      ...(r.keywords?.urgencyKeywords    || []),
      ...(r.keywords?.authorityKeywords  || []),
    ];
    allWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generates a complete analytics dashboard data object.
 * @param {Array<Object>} reports
 * @returns {Object}
 */
function generateDashboardData(reports) {
  return {
    generatedAt:        new Date().toISOString(),
    stats:              computeStats(reports),
    riskDistribution:   getRiskDistribution(reports),
    attackTypeFrequency: getAttackTypeFrequency(reports),
    dailyTrend:         getDailyTrend(reports),
    topThreats:         getTopThreats(reports, 10),
    keywordFrequency:   getKeywordFrequency(reports).slice(0, 20),
  };
}

// ── API Integration ────────────────────────────────────────────────────────────

/**
 * Fetches history from backend and builds dashboard data.
 * @param {string} apiBase
 * @returns {Promise<Object>}
 */
async function fetchAndAnalyze(apiBase = 'http://localhost:5000/api') {
  const response = await fetch(`${apiBase}/history`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const { history } = await response.json();
  return generateDashboardData(history);
}

// ── Exports ────────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    computeStats,
    getRiskDistribution,
    getAttackTypeFrequency,
    getDailyTrend,
    getTopThreats,
    getKeywordFrequency,
    generateDashboardData,
    fetchAndAnalyze,
  };
}
