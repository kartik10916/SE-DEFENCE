import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = () => {
      fetch('http://localhost:5000/api/stats')
        .then(r => r.json())
        .then(d => setStats(d))
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand" aria-label="SE Defense home">
          <div className="navbar-logo" aria-hidden="true">🛡️</div>
          <span className="navbar-title">SE<span> Defense</span></span>
          <span className="navbar-badge">v2.0</span>
        </a>

        <div className="navbar-right">
          {stats && stats.totalScans > 0 && (
            <div className="navbar-scan-count" aria-label={`${stats.totalScans} scans completed`}>
              <span className="scan-count-num">{stats.totalScans}</span>
              <span className="scan-count-label">scans</span>
            </div>
          )}
          <div className="navbar-status" role="status" aria-live="polite">
            <div className="status-dot" aria-hidden="true" />
            <span>{stats ? 'Online' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
