import React from 'react';
import { Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import ProtectedRoute from './components/ProtectedRoute'; // Importamos el guardia

import './App.css';
import Footer from './components/Footer';
import Header from './components/Header';

const AppLayout = () => {
  const { loading, error } = useGlobalContext();
  const { currentUser } = useAuth();
  const location = useLocation();

  const projectId = db.app.options.projectId;

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
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '20px',
          backgroundColor: '#ffc107',
          color: 'black',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '14px',
          zIndex: 9999,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          Conectado a: <strong>{projectId}</strong>
        </div>
      )}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h3>Eva3</h3>
          <span>Evaluaciones, Calidad y Monitoreo</span>
        </div>
        <ul className="nav-list">
          <li><NavLink to="/" end>Dashboard</NavLink></li>
          <li><NavLink to="/team">Equipo</NavLink></li>
          {currentUser && (
            <>
              <li><NavLink to="/evaluate">Evaluar</NavLink></li>
              <li><NavLink to="/configuration">Configuración</NavLink></li>
            </>
          )}
        </ul>
      </nav>
      <div className="main-panel">
        <Header />
        <main className="main-content">
          <TransitionGroup>
            <CSSTransition
              key={location.pathname} 
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

function App() {
  return (
      <Routes>
          <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="team" element={<Team />} />
              <Route 
                  path="evaluate" 
                  element={
                      <ProtectedRoute>
                          <Evaluate />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="configuration" 
                  element={
                      <ProtectedRoute>
                          <Configuration />
                      </ProtectedRoute>
                  } 
              />
          </Route>
      </Routes>
  );
}

export default App;
