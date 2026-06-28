/**
 * charts.js — SE Defense Analytics Dashboard Charts
 *
 * Provides Chart.js configuration factories for all dashboard visualisations.
 * Works with analytics.js data output.
 *
 * Usage:
 *   import { buildRiskDonut, buildTrendLine, buildAttackBar } from './charts';
 *   const ctx = document.getElementById('myChart').getContext('2d');
 *   new Chart(ctx, buildRiskDonut(dashboardData.riskDistribution));
 */

'use strict';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const PALETTE = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
  primary:  '#6366f1',
  cyan:     '#06b6d4',
  purple:   '#8b5cf6',
  emerald:  '#10b981',
};

const ATTACK_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#8b5cf6',
  '#6366f1', '#06b6d4', '#10b981',
];

const FONT = "'Inter', system-ui, sans-serif";

const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font:  { family: FONT, size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#1a2540',
      borderColor:     'rgba(255,255,255,0.1)',
      borderWidth:     1,
      titleColor:      '#f1f5f9',
      bodyColor:       '#94a3b8',
      padding:         10,
      cornerRadius:    8,
    },
  },
};

// ── 1. Risk Level Donut Chart ─────────────────────────────────────────────────
/**
 * @param {{ Low: number, Medium: number, High: number, Critical: number }} dist
 */
function buildRiskDonut(dist) {
  return {
    type: 'doughnut',
    data: {
      labels:   Object.keys(dist),
      datasets: [{
        data:            Object.values(dist),
        backgroundColor: [PALETTE.low, PALETTE.medium, PALETTE.high, PALETTE.critical],
        borderColor:     '#060d1a',
        borderWidth:     3,
        hoverOffset:     8,
      }],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      cutout: '68%',
      plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        legend: {
          position: 'right',
          labels: {
            color:    '#94a3b8',
            font:     { family: FONT, size: 12 },
            padding:  14,
            usePointStyle: true,
          },
        },
      },
    },
  };
}

// ── 2. Daily Trend Line Chart ─────────────────────────────────────────────────
/**
 * @param {Array<{date: string, avgScore: number, count: number}>} trend
 */
function buildTrendLine(trend) {
  return {
    type: 'line',
    data: {
      labels:   trend.map(d => d.date),
      datasets: [
        {
          label:           'Avg Risk Score',
          data:            trend.map(d => d.avgScore),
          borderColor:     PALETTE.primary,
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderWidth:     2,
          pointRadius:     4,
          pointBackgroundColor: PALETTE.primary,
          tension:         0.4,
          fill:            true,
        },
        {
          label:           'Analyses / Day',
          data:            trend.map(d => d.count),
          borderColor:     PALETTE.cyan,
          backgroundColor: 'transparent',
          borderWidth:     1.5,
          borderDash:      [5, 5],
          pointRadius:     3,
          pointBackgroundColor: PALETTE.cyan,
          tension:         0.4,
          yAxisID:         'y2',
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { family: FONT, size: 11 } },
        },
        y: {
          min: 0, max: 100,
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { family: FONT, size: 11 } },
          title: { display: true, text: 'Risk Score', color: '#64748b' },
        },
        y2: {
          position: 'right',
          grid:  { drawOnChartArea: false },
          ticks: { color: '#64748b', font: { family: FONT, size: 11 } },
          title: { display: true, text: 'Count', color: '#64748b' },
        },
      },
    },
  };
}

// ── 3. Attack Type Frequency Bar Chart ────────────────────────────────────────
/**
 * @param {Array<{type: string, count: number}>} freq
 */
function buildAttackBar(freq) {
  return {
    type: 'bar',
    data: {
      labels:   freq.map(f => f.type),
      datasets: [{
        label:           'Detections',
        data:            freq.map(f => f.count),
        backgroundColor: ATTACK_COLORS.map(c => c + 'cc'),
        borderColor:     ATTACK_COLORS,
        borderWidth:     1.5,
        borderRadius:    6,
      }],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      indexAxis: 'y',
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { family: FONT, size: 11 } },
        },
        y: {
          grid:  { display: false },
          ticks: { color: '#94a3b8', font: { family: FONT, size: 11 } },
        },
      },
      plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        legend: { display: false },
      },
    },
  };
}

// ── 4. Keyword Word Bubble Chart (Scatter) ────────────────────────────────────
/**
 * @param {Array<{word: string, count: number}>} keywords
 */
function buildKeywordBubble(keywords) {
  const MAX_R = 30;
  const maxCount = Math.max(...keywords.map(k => k.count), 1);

  return {
    type: 'bubble',
    data: {
      datasets: keywords.map((k, i) => ({
        label: k.word,
        data: [{
          x: (i % 8) * 12 + Math.random() * 4,
          y: Math.floor(i / 8) * 12 + Math.random() * 4,
          r: Math.max(6, (k.count / maxCount) * MAX_R),
        }],
        backgroundColor: ATTACK_COLORS[i % ATTACK_COLORS.length] + '99',
        borderColor:     ATTACK_COLORS[i % ATTACK_COLORS.length],
        borderWidth:     1.5,
      })),
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: { display: false },
        y: { display: false },
      },
      plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        tooltip: {
          ...BASE_CHART_OPTIONS.plugins.tooltip,
          callbacks: {
            label: (ctx) => `"${ctx.dataset.label}" — ${keywords[ctx.datasetIndex]?.count} hits`,
          },
        },
      },
    },
  };
}

// ── 5. Score History Histogram ────────────────────────────────────────────────
/**
 * @param {Array<Object>} reports
 */
function buildScoreHistogram(reports) {
  const buckets = [0, 0, 0, 0, 0]; // 0-19, 20-39, 40-59, 60-79, 80-100
  const labels  = ['0–19', '20–39', '40–59', '60–79', '80–100'];
  const colors  = [PALETTE.low, PALETTE.low, PALETTE.medium, PALETTE.high, PALETTE.critical];

  reports.forEach(r => {
    const idx = Math.min(Math.floor(r.riskScore / 20), 4);
    buckets[idx]++;
  });

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Analyses',
        data:            buckets,
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor:     colors,
        borderWidth:     1.5,
        borderRadius:    8,
      }],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: {
          grid:  { display: false },
          ticks: { color: '#94a3b8', font: { family: FONT, size: 11 } },
          title: { display: true, text: 'Risk Score Range', color: '#64748b' },
        },
        y: {
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { family: FONT, size: 11 } },
          title: { display: true, text: 'Count', color: '#64748b' },
        },
      },
      plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        legend: { display: false },
      },
    },
  };
}

// ── Exports ────────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    buildRiskDonut,
    buildTrendLine,
    buildAttackBar,
    buildKeywordBubble,
    buildScoreHistogram,
    PALETTE,
    ATTACK_COLORS,
  };
}
