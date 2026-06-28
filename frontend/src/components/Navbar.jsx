import React from 'react';

const Navbar = () => (
  <nav className="navbar" role="navigation" aria-label="Main navigation">
    <div className="navbar-inner">
      <a href="/" className="navbar-brand" aria-label="SE Defense home">
        <div className="navbar-logo" aria-hidden="true">🛡️</div>
        <span className="navbar-title">SE<span> Defense</span></span>
        <span className="navbar-badge">AI</span>
      </a>

      <div className="navbar-status" role="status" aria-live="polite">
        <div className="status-dot" aria-hidden="true" />
        <span>Engine online</span>
      </div>
    </div>
  </nav>
);

export default Navbar;
