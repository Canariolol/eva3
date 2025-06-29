import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import './App.css';

function App() {
  const location = useLocation();
  // Removed showEvaluateDropdown state as it's no longer needed for a dropdown

  return (
    <div className="App">
      <nav>
        <div className="navbar-content">
          <div className="app-title">
            <span className="app-title-main">Eva3</span>
            <span className="app-title-subtitle">Evaluaciones, Calidad y Monitoreo</span>
          </div>
          <ul>
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
            </li>
            <li>
              <Link to="/team" className={location.pathname === '/team' ? 'active' : ''}>Equipo</Link>
            </li>
            <li>
              <Link to="/evaluate" className={location.pathname.startsWith('/evaluate') ? 'active' : ''}>
                Evaluar
              </Link>
              {/* Removed dropdown content */}
            </li>
            <li>
              <Link to="/configuration" className={location.pathname === '/configuration' ? 'active' : ''}>Configuración</Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/evaluate" element={<Evaluate />} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;