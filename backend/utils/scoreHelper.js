/**
 * scoreHelper.js — Utility functions for score normalisation and formatting.
 */

/**
 * Clamps a value between min and max.
 */
const clamp = (value, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);

/**
 * Returns a CSS-compatible color string for a given score.
 */
const scoreToColor = (score) => {
  if (score >= 80) return '#ef4444';   // red   — critical
  if (score >= 60) return '#f97316';   // orange — high
  if (score >= 30) return '#f59e0b';   // amber  — medium
  return '#22c55e';                    // green  — low
};

/**
 * Returns a text label for a given score.
 */
const scoreToLabel = (score) => {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
};

/**
 * Calculates a weighted average of sub-scores.
 * @param {{ score: number, weight: number }[]} items
 */
const weightedAverage = (items) => {
  const totalWeight = items.reduce((acc, i) => acc + i.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = items.reduce((acc, i) => acc + i.score * i.weight, 0);
  return Math.round(weighted / totalWeight);
};

module.exports = { clamp, scoreToColor, scoreToLabel, weightedAverage };
