import React from 'react';

const AnalyzeButton = ({ onClick, loading, disabled }) => (
  <button
    id="analyze-btn"
    className="btn-primary"
    onClick={onClick}
    disabled={disabled || loading}
    type="button"
    aria-busy={loading}
    aria-label={loading ? 'Analyzing…' : 'Check for threats'}
  >
    {loading ? (
      <>
        <span className="spinner" aria-hidden="true" />
        Checking for threats…
      </>
    ) : (
      <>
        <span aria-hidden="true">⚡</span>
        Check for Threats
      </>
    )}
  </button>
);

export default AnalyzeButton;
