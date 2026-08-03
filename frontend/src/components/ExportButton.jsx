import React from 'react';

/**
 * Exports the full analysis report as a JSON file download.
 */
const ExportButton = ({ report, inputText }) => {
  if (!report) return null;

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      analysis: {
        id:          report.id,
        timestamp:   report.timestamp,
        inputLength: report.inputLength,
        analysisTime: report.analysisTime,
        riskScore:   report.riskScore,
        riskLevel:   report.riskLevel,
        confidence:  report.confidence,
        attackTypes: report.attackTypes,
        summary:     report.explanation.summary,
        findings:    report.explanation.findings,
        advice:      report.explanation.advice,
        keywords: {
          suspicious: report.keywords.suspiciousKeywords,
          urgency:    report.keywords.urgencyKeywords,
          authority:  report.keywords.authorityKeywords,
          sensitive:  report.keywords.sensitiveKeywords,
          score:      report.keywords.score,
        },
        urls: {
          total:      report.urls.totalUrls,
          suspicious: report.urls.suspiciousUrls,
          score:      report.urls.score,
        },
        sentiment: {
          score:     report.sentiment.score,
          toneLabel: report.sentiment.toneLabel,
          fearWords: report.sentiment.fearWords,
          urgency:   report.sentiment.urgencyPhrases,
          coercion:  report.sentiment.coercionPhrases,
        },
      },
      inputPreview: inputText.slice(0, 200),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `se-defense-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="btn-export"
      onClick={handleExport}
      type="button"
      aria-label="Export analysis report as JSON"
    >
      <span aria-hidden="true">↓</span>
      Export Report
    </button>
  );
};

export default ExportButton;
