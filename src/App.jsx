import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import './App.css';
import Footer from './components/Footer';
import Header from './components/Header';
import './components/Header.css';

// Layout principal con la barra lateral de navegación
const AppLayout = () => (
  <div className="app-layout">
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3>Eva3</h3>
        <span>Evaluaciones, Calidad y Monitoreo</span>
      </div>
      <ul className="nav-list">
        <li><NavLink to="/" end>Dashboard</NavLink></li>
        <li><NavLink to="/team">Equipo</NavLink></li>
        <li><NavLink to="/evaluate">Evaluar</NavLink></li>
        <li><NavLink to="/configuration">Configuración</NavLink></li>
      </ul>
    </nav>
    <div className="main-panel">
      <Header />
      <main className="main-content">
        {/* Las páginas se renderizarán aquí */}
        <Outlet />
      </main>
      <Footer />
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="team" element={<Team />} />
          <Route path="evaluate" element={<Evaluate />} />
          <Route path="configuration" element={<Configuration />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
