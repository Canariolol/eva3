import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './responsive.css';
import 'react-quill/dist/quill.snow.css';

// Nuevos estilos refactorizados
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/forms.css';
import './styles/cards.css';
import './styles/components.css';
import './styles/modal.css';
import './styles/animations.css';

import { GlobalProvider } from './context/GlobalContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <GlobalProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GlobalProvider>
    </Router>
  </React.StrictMode>,
);
