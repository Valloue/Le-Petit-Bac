import { auth } from './config/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Éléments du DOM
const loadingMessage = document.querySelector('.loading');
const errorMessage = document.querySelector('.error-message');

// Fonction pour gérer les erreurs
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
    }
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
}

// Fonction pour rediriger
function redirect(path) {
    try {
        window.location.href = path;
    } catch (error) {
        showError('Erreur lors de la redirection. Veuillez rafraîchir la page.');
    }
}

// Vérifier l'état de l'authentification avec timeout
const authTimeout = setTimeout(() => {
    showError('La vérification prend plus de temps que prévu. Veuillez rafraîchir la page.');
}, 10000); // 10 secondes timeout

// Vérifier l'état de l'authentification
onAuthStateChanged(auth, (user) => {
    clearTimeout(authTimeout);
    
    if (user) {
        // Si l'utilisateur est connecté, rediriger vers le dashboard
        redirect('./dashboard.html');
    } else {
        // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
        redirect('./auth.html');
    }
}, (error) => {
    clearTimeout(authTimeout);
    showError('Erreur de connexion : ' + error.message);
}); 