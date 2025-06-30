import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import './App.css'; // Aseguramos que los estilos de App se carguen

// Componente para el Layout principal que incluye la barra de navegación
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
      {children}
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

// Sobrescribimos el App.css para incluir el layout de la barra lateral
const newCss = `
/* src/App.css */

.app-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: var(--color-dark);
  color: var(--color-light);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  margin-bottom: 2rem;
}

.sidebar-header h3 {
  color: white;
  margin: 0;
  font-size: 1.8rem;
}

.sidebar-header span {
  font-size: 0.9rem;
  color: var(--color-secondary);
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-list li a {
  display: block;
  padding: 12px 15px;
  color: var(--color-light);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: var(--transition);
  font-weight: 600;
}

.nav-list li a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-list li a.active {
  background-color: var(--color-primary);
  color: white;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2.5rem;
}

/* El resto de los estilos que teníamos antes */
.btn { padding: 10px 20px; font-family: var(--font-primary); font-weight: 600; border: none; border-radius: var(--border-radius); cursor: pointer; transition: var(--transition); display: inline-flex; align-items: center; gap: 8px; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
.btn-primary { background-color: var(--color-primary); color: white; }
.btn-primary:hover { background-color: var(--color-primary-dark); box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3); transform: translateY(-2px); }
.btn-primary:disabled { background-color: var(--color-secondary); cursor: not-allowed; transform: none; box-shadow: none; }
.btn-danger { background-color: var(--color-danger); color: white; }
.btn-danger:hover { background-color: #c82333; transform: translateY(-2px); }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--color-dark); }
.form-control { width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--border-radius); box-sizing: border-box; transition: var(--transition); font-family: var(--font-secondary); }
.form-control:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25); }
.card { background-color: var(--color-background); border-radius: var(--border-radius); box-shadow: var(--box-shadow); padding: 2rem; transition: var(--transition); }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 2rem; }
.dashboard-section { margin-bottom: 3rem; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
.team-card { text-align: center; cursor: pointer; padding: 2rem; } /* Añadido padding a team-card */
.team-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary); color: white; display: inline-flex; justify-content: center; align-items: center; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
.team-card h2 { margin: 10px 0 5px; }
.team-card p { color: var(--color-secondary); margin: 0; }
.config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2.5rem; }
.config-list { list-style: none; padding: 0; margin-top: 1.5rem; }
.config-list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--color-border); transition: var(--transition); }
.config-list-item:hover { background-color: #f8f9fa; }
.config-actions { display: flex; align-items: center; gap: 8px; }
.btn-icon { background: transparent; border: none; cursor: pointer; font-size: 1rem; padding: 5px; line-height: 1; color: var(--color-secondary); }
.btn-icon:hover { color: var(--color-dark); }
.btn-icon-danger { color: var(--color-danger); }
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.3s ease; }
.modal-content { background: white; padding: 2.5rem; border-radius: var(--border-radius); width: 90%; max-width: 500px; position: relative; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); animation: slideIn 0.4s ease-out; }
.modal-close-btn { position: absolute; top: 15px; right: 15px; background: transparent; border: none; font-size: 1.8rem; cursor: pointer; color: var(--color-secondary); line-height: 1; }
.modal-close-btn:hover { color: var(--color-dark); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

// Aplicamos el nuevo CSS
// fs.writeFileSync('src/App.css', newCss);
export default App;
