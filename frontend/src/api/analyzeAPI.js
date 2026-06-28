import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * Sends text to the backend for social engineering analysis.
 * @param {string} text
 * @returns {Promise<Object>} analysis report
 */
export const analyzeText = async (text) => {
  const { data } = await axios.post(`${API_BASE}/analyze`, { text }, {
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });
  return data.report;
};

/**
 * Fetches recent analysis history from the backend.
 * @returns {Promise<Array>}
 */
export const fetchHistory = async () => {
  const { data } = await axios.get(`${API_BASE}/history`, { timeout: 5000 });
  return data.history;
};
