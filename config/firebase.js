import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDVtm-IgdfMZ0oToXw0dLewpH1q6BZUTN0",
    authDomain: "onion-note.firebaseapp.com",
    projectId: "onion-note",
    storageBucket: "onion-note.firebasestorage.app",
    messagingSenderId: "678827914649",
    appId: "1:678827914649:web:66882c871778d550d90f08",
    measurementId: "G-71M8EMYFB8"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 