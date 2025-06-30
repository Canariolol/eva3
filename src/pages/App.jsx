import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './Dashboard';
import Team from './Team';
import Evaluate from './Evaluate';
import Configuration from './Configuration';
import Footer from '../components/Footer';
import '../App.css';
import '../components/Footer.css';

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3>Eva3</h3>
        <span>Evaluaciones</span>
      </div>
      <ul className="nav-list">
        <li><NavLink to="/" end>Dashboard</NavLink></li>
        <li><NavLink to="/team">Equipo</NavLink></li>
        <li><NavLink to="/evaluate">Evaluar</NavLink></li>
        <li><NavLink to="/configuration">Configuración</NavLink></li>
      </ul>
    </nav>
    <main className="main-content">
      <div className="content-wrap">
        {children}
      </div>
      <Footer />
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/evaluate" element={<Evaluate />} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
export default App;
