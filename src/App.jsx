import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import './App.css';
import Footer from './components/Footer';
import Header from './components/Header';
import './components/Header.css';

const AnimatedPage = ({ children }) => (
    <div className="page-fade-in">{children}</div>
);

const AppLayout = () => {
  const { loading, error } = useGlobalContext();

  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h1>Cargando aplicación...</h1>
        </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <h1>{error}</h1>
      </div>
    );
  }
  
  return (
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
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
};

function App() {
  return (
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="team" element={<AnimatedPage><Team /></AnimatedPage>} />
            <Route path="evaluate" element={<AnimatedPage><Evaluate /></AnimatedPage>} />
            <Route path="configuration" element={<AnimatedPage><Configuration /></AnimatedPage>} />
          </Route>
        </Routes>
      </Router>
    </GlobalProvider>
  );
}

export default App;
