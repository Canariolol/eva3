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

import { GoogleOAuthProvider } from '@react-oauth/google';
import { GlobalProvider } from './context/GlobalContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';

const googleClientId = "636042825570-a6bpcvdg5p5agdunbir9q9o9bdifk13s.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <GoogleOAuthProvider clientId={googleClientId}>
        <GlobalProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GlobalProvider>
      </GoogleOAuthProvider>
    </Router>
  </React.StrictMode>,
);
