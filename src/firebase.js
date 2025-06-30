// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add your web app's Firebase configuration
// You can get this from the Firebase Console for your project
const firebaseConfig = {
  apiKey: "AIzaSyCzH7D38TffwS24KeLzBA37lOMc7XtaTLw",
  authDomain: "eva3-1b284.firebaseapp.com",
  projectId: "eva3-1b284",
  storageBucket: "eva3-1b284.firebasestorage.app",
  messagingSenderId: "636042825570",
  appId: "1:636042825570:web:4841cfc98c02d30085a63b",
  measurementId: "G-3P009KB1CM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a Firestore instance
// This 'db' object is what you'll use to interact with your database.
export const db = getFirestore(app);
