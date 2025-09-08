// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions"; // <-- 1. IMPORTAR FUNCTIONS

// Lee las credenciales desde las variables de entorno inyectadas por Vite.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Conectando al proyecto de Firebase:", firebaseConfig.projectId);

if (!firebaseConfig.projectId) {
  throw new Error("La variable de entorno VITE_FIREBASE_PROJECT_ID no está definida. Asegúrate de tener un archivo .env con la configuración de Firebase.");
}
      
export const app = initializeApp(firebaseConfig);
      
export const db = getFirestore(app);
export const auth = getAuth(app);
// --- 2. INICIALIZAR Y EXPORTAR FUNCTIONS ---
export const functions = getFunctions(app, "southamerica-west1");
