import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { instances } from './firebase-instances';

// Función para obtener el subdominio de la URL actual
const getSubdomain = () => {
  const hostname = window.location.hostname;

  if (hostname === 'localhost') {
    return 'localhost';
  }

  const parts = hostname.split('.');
  
  // Si estamos en una URL sin subdominio (ej: tu-dominio.com),
  // no hay un subdominio de cliente específico.
  if (parts.length < 3 || parts[0] === 'www') {
    return null;
  }
  
  return parts[0];
};

// Determina qué configuración de Firebase usar
const subdomain = getSubdomain();
const firebaseConfig = instances[subdomain] || instances['default'];

// Inicializa Firebase con la configuración seleccionada
const app = initializeApp(firebaseConfig);

// Obtiene una instancia de Firestore
// Este objeto 'db' es el que se usará para interactuar con la base de datos.
export const db = getFirestore(app);
