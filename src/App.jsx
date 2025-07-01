import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import './App.css';
import Footer from './components/Footer';
import Header from './components/Header';
import './components/Header.css';

const AppLayout = () => {
  const { loading, error } = useGlobalContext();
  const location = useLocation();

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
          <TransitionGroup>
            <CSSTransition
              key={location.key}
              classNames="page-fade"
              timeout={300}
            >
              <Outlet />
            </CSSTransition>
          </TransitionGroup>
        </main>
        <Footer />
      </div>
    </div>
  )
};

const PageRoutes = () => {
    return (
        <Routes>
            <Route index element={<Dashboard />} />
            <Route path="team" element={<Team />} />
            <Route path="evaluate" element={<Evaluate />} />
            <Route path="configuration" element={<Configuration />} />
        </Routes>
    )
}

function App() {
  return (
    <GlobalProvider>
      <Router>
        <Routes>
            <Route path="*" element={<AppLayout />}>
                 <Route path="*" element={<PageRoutes />} />
            </Route>
        </Routes>
      </Router>
    </GlobalProvider>
  );
}

export default App;
