import { auth, db } from './config/firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Vérification de l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './index.html';
    } else {
        loadUserData(user.uid);
    }
});

// Chargement des données utilisateur
async function loadUserData(userId) {
    const userDoc = await doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    const userData = userSnap.data();
    document.getElementById('userPseudo').textContent = userData.pseudo;
}

// Gestion de la déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = './index.html';
    } catch (error) {
        alert('Erreur lors de la déconnexion : ' + error.message);
    }
}); 