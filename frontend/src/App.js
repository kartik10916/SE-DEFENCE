import React from 'react';
import Navbar from './components/Navbar';
import Home   from './pages/Home';

function App() {
  return (
    <div className="app-wrapper">
      {/* Aurora background orb 3 — centre indigo-blue */}
      <div className="aurora-orb" aria-hidden="true" />
      <Navbar />
      <main className="main-content">
        <Home />
      </main>
    </div>
  );
}

export default App;
