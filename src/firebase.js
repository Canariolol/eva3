// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, updateDoc } from "firebase/firestore"; // Importar funciones de escritura
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  throw new Error("La variable de entorno VITE_FIREBASE_PROJECT_ID no está definida.");
}
      
// Inicialización de servicios de Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "southamerica-west1");

// --- FUNCIONES HELPER PARA FIRESTORE ---

/**
 * Obtiene una lista de todas las compañías.
 * Protegido por reglas de Firestore para 'superadmin'.
 */
export const getAllCompanies = async () => {
    try {
        const companiesCol = collection(db, 'companies');
        const companySnapshot = await getDocs(companiesCol);
        const companyList = await Promise.all(companySnapshot.docs.map(async (doc) => {
            const headerInfoRef = collection(doc.ref, 'headerInfo');
            const headerInfoSnap = await getDocs(headerInfoRef);
            const headerInfo = headerInfoSnap.docs.length > 0 ? headerInfoSnap.docs[0].data() : null;
            return {
                id: doc.id,
                ...doc.data(),
                headerInfo
            };
        }));
        return companyList;
    } catch (error) {
        console.error("Error fetching all companies:", error);
        return [];
    }
};

/**
 * Crea o sobreescribe completamente un documento con un ID específico.
 * @param {string} collectionPath - Ruta a la colección (ej. 'users').
 * @param {string} docId - El ID del documento a crear/reemplazar.
 * @param {object} data - El objeto con los datos a guardar.
 */
export const setDocument = async (collectionPath, docId, data) => {
    try {
        await setDoc(doc(db, collectionPath, docId), data);
        console.log(`Documento ${docId} guardado en ${collectionPath}`);
    } catch (error) {
        console.error(`Error guardando documento en ${collectionPath}:`, error);
        throw error; // Re-lanzar el error para que el componente que llama pueda manejarlo
    }
};

/**
 * Añade un nuevo documento a una colección, Firestore genera el ID automáticamente.
 * @param {string} collectionPath - Ruta a la colección (ej. 'evaluations').
 * @param {object} data - El objeto con los datos a guardar.
 * @returns {string} El ID del nuevo documento.
 */
export const addDocument = async (collectionPath, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionPath), data);
        console.log(`Documento añadido con ID: ${docRef.id} en ${collectionPath}`);
        return docRef.id;
    } catch (error) {
        console.error(`Error añadiendo documento en ${collectionPath}:`, error);
        throw error;
    }
};

/**
 * Actualiza campos específicos de un documento existente sin sobreescribirlo.
 * @param {string} collectionPath - Ruta a la colección (ej. 'users').
 * @param {string} docId - El ID del documento a actualizar.
 * @param {object} data - El objeto con los campos a actualizar.
 */
export const updateDocument = async (collectionPath, docId, data) => {
    try {
        await updateDoc(doc(db, collectionPath, docId), data);
        console.log(`Documento ${docId} actualizado en ${collectionPath}`);
    } catch (error) {
        console.error(`Error actualizando documento en ${collectionPath}:`, error);
        throw error;
    }
};
