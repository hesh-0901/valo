// js/config.js

// Utilisation des CDN ES Modules officiels de Firebase pour la production browser / GitHub Pages
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuration Firebase de VALO
const firebaseConfig = {
  apiKey: "AIzaSyBodnJzWUPe-4IxRYe78FKULXLm0AUhTfw",
  authDomain: "valo-aa2b8.firebaseapp.com",
  projectId: "valo-aa2b8",
  storageBucket: "valo-aa2b8.firebasestorage.app",
  messagingSenderId: "479148592570",
  appId: "1:479148592570:web:3e2b3dfb9a99411530e183",
  measurementId: "G-TFVZ92M8LY"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation des services essentiels exportés
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Fonction pour connecter un utilisateur via son nom d'utilisateur standard
 * @param {string} username - Le nom d'utilisateur (ex: henoch)
 * @param {string} password - Le mot de passe
 */
export const loginWithUsername = async (username, password) => {
  // Transformation du username en e-mail virtuel masqué pour Firebase Auth
  const virtualEmail = `${username.toLowerCase().trim()}@valo.local`;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, virtualEmail, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Fonction pour créer un compte avec un nom d'utilisateur standard
 * @param {string} username - Le nom d'utilisateur choisi
 * @param {string} password - Le mot de passe
 */
export const registerWithUsername = async (username, password) => {
  const virtualEmail = `${username.toLowerCase().trim()}@valo.local`;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};
