import { auth, db } from '../config/firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, addDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Vérification de l'authentification
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Vérifions d'abord si nous avons un userId dans le sessionStorage
        const storedUserId = sessionStorage.getItem('userId');
        if (!storedUserId) {
            window.location.href = '/';
            return;
        }
        // Si nous avons un userId stocké, continuons avec celui-ci
        await loadUserData(storedUserId);
    } else {
        await loadUserData(user.uid);
    }
});

// Chargement des données utilisateur
async function loadUserData(userId) {
    const userDoc = await doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    const userData = userSnap.data();
    document.getElementById('userPseudo').textContent = userData.pseudo;
}

// Gestion du timer
const timerEnabled = document.getElementById('timerEnabled');
const timerDuration = document.getElementById('timerDuration');

timerEnabled.addEventListener('change', () => {
    timerDuration.disabled = !timerEnabled.checked;
});

// Gestion des catégories personnalisées
const customCategories = new Set();
const addCustomCategory = document.getElementById('addCustomCategory');
const customCategoryInput = document.getElementById('customCategory');
const customCategoriesList = document.getElementById('customCategoriesList');

addCustomCategory.addEventListener('click', () => {
    const category = customCategoryInput.value.trim();
    if (category && !customCategories.has(category)) {
        customCategories.add(category);
        addCustomCategoryTag(category);
        customCategoryInput.value = '';
    }
});

function addCustomCategoryTag(category) {
    const tag = document.createElement('div');
    tag.className = 'custom-category-tag';
    tag.innerHTML = `
        ${category}
        <button type="button" onclick="removeCategory('${category}')">&times;</button>
    `;
    customCategoriesList.appendChild(tag);
}

// Fonction globale pour supprimer une catégorie
window.removeCategory = function(category) {
    customCategories.delete(category);
    updateCustomCategoriesList();
};

function updateCustomCategoriesList() {
    customCategoriesList.innerHTML = '';
    customCategories.forEach(addCustomCategoryTag);
}

// Gestion du formulaire
const createGameForm = document.getElementById('createGameForm');
const cancelButton = document.getElementById('cancelButton');

// Ajoutons la liste des lettres possibles
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Fonction pour obtenir une lettre aléatoire
function getRandomLetter() {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

createGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('gameTitle').value;
    const defaultCategories = Array.from(document.querySelectorAll('.categories-grid input[type="checkbox"]:checked'))
        .map(input => input.value);
    
    const allCategories = [...defaultCategories, ...customCategories];
    
    if (allCategories.length === 0) {
        alert('Veuillez sélectionner au moins une catégorie');
        return;
    }

    try {
        const gameData = {
            title,
            categories: allCategories,
            status: 'active',
            participants: [auth.currentUser.uid],
            createdAt: new Date().toISOString(),
            currentLetter: getRandomLetter(),
            timer: {
                enabled: timerEnabled.checked,
                duration: timerEnabled.checked ? parseInt(timerDuration.value) : null
            }
        };

        const gameRef = await addDoc(collection(db, 'games'), gameData);
        createGameForm.style.display = 'none';
        
        // Afficher la section de partage avec la lettre choisie
        const shareSection = document.getElementById('shareSection');
        const gameShareId = document.getElementById('gameShareId');
        shareSection.style.display = 'block';
        gameShareId.value = gameRef.id;
        
        // Mettre à jour le message de succès pour inclure la lettre
        const successTitle = document.querySelector('.share-section h2');
        successTitle.innerHTML = `Partie créée avec succès !<br><span class="chosen-letter">Lettre tirée : ${gameData.currentLetter}</span>`;
        
        setupCopyButton(gameRef.id);
        setupActionButtons(gameRef.id);
    } catch (error) {
        console.error('Erreur lors de la création de la partie:', error);
        alert('Erreur lors de la création de la partie');
    }
});

// Fonction pour gérer le bouton de copie
function setupCopyButton(gameId) {
    const copyButton = document.getElementById('copyShareId');
    
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(gameId);
            copyButton.classList.add('copied');
            
            setTimeout(() => {
                copyButton.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            alert('Erreur lors de la copie de l\'ID');
        }
    });
}

// Fonction pour gérer les boutons d'action
function setupActionButtons(gameId) {
    const startGameBtn = document.getElementById('startGameBtn');
    const backToDashboard = document.getElementById('backToDashboard');
    
    startGameBtn.addEventListener('click', () => {
        sessionStorage.setItem('currentGameId', gameId);
        window.location.href = '/game';
    });
    
    backToDashboard.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });
}

cancelButton.addEventListener('click', () => {
    window.location.href = '/dashboard';
});

// Gestion de la déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '/';
    } catch (error) {
        alert('Erreur lors de la déconnexion : ' + error.message);
    }
}); 