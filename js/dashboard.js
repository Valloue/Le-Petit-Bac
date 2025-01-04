import { auth, db } from './config/firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Vérification de l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './index.html';
    } else {
        sessionStorage.setItem('userId', user.uid);
        loadUserData(user.uid);
        setupGameListeners(user.uid);
    }
});

// Chargement des données utilisateur
async function loadUserData(userId) {
    const userDoc = await doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    const userData = userSnap.data();
    document.getElementById('userPseudo').textContent = userData.pseudo;
}

// Configuration des écouteurs pour les parties
function setupGameListeners(userId) {
    // Écouter les parties en cours
    const activeGamesQuery = query(
        collection(db, 'games'),
        where('status', '==', 'active'),
        where('participants', 'array-contains', userId)
    );

    onSnapshot(activeGamesQuery, (snapshot) => {
        const activeGamesContainer = document.getElementById('activeGames');
        activeGamesContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const game = doc.data();
            const gameCard = createGameCard(game, doc.id);
            activeGamesContainer.appendChild(gameCard);
        });
    });

    // Écouter les parties terminées
    const completedGamesQuery = query(
        collection(db, 'games'),
        where('status', '==', 'completed'),
        where('participants', 'array-contains', userId)
    );

    onSnapshot(completedGamesQuery, (snapshot) => {
        const completedGamesContainer = document.getElementById('completedGames');
        completedGamesContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const game = doc.data();
            const gameCard = createGameCard(game, doc.id);
            completedGamesContainer.appendChild(gameCard);
        });
    });
}

// Création d'une carte de jeu
function createGameCard(game, gameId) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
        <h3>${game.title}</h3>
        <p>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            ${game.participants.length} joueurs
        </p>
        <p>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            ${game.categories.join(', ')}
        </p>
    `;
    
    card.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const gameDoc = await getDoc(doc(db, 'games', gameId));
            if (gameDoc.exists()) {
                sessionStorage.setItem('currentGameId', gameId);
                window.location.href = '/game';
            } else {
                alert('Cette partie n\'existe pas ou a été supprimée');
            }
        } catch (error) {
            console.error('Erreur lors de l\'accès à la partie:', error);
            alert('Erreur lors de l\'accès à la partie');
        }
    });
    
    return card;
}

// Gestion de la déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '/';
    } catch (error) {
        alert('Erreur lors de la déconnexion : ' + error.message);
    }
});

// Gestion du bouton pour rejoindre une partie
document.getElementById('joinGameBtn').addEventListener('click', async () => {
    const gameId = prompt('Entrez l\'ID de la partie que vous souhaitez rejoindre :');
    if (!gameId) return;

    try {
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        
        if (!gameDoc.exists()) {
            alert('Cette partie n\'existe pas');
            return;
        }
        
        const gameData = gameDoc.data();
        
        if (gameData.status !== 'active') {
            alert('Cette partie est déjà terminée');
            return;
        }
        
        if (gameData.participants.includes(auth.currentUser.uid)) {
            // Si l'utilisateur est déjà dans la partie, on le redirige simplement
            sessionStorage.setItem('currentGameId', gameId);
            window.location.href = '/game';
            return;
        }
        
        // Ajouter l'utilisateur aux participants
        await updateDoc(doc(db, 'games', gameId), {
            participants: [...gameData.participants, auth.currentUser.uid]
        });
        
        // Rediriger vers la partie
        sessionStorage.setItem('currentGameId', gameId);
        window.location.href = '/game';
    } catch (error) {
        console.error('Erreur lors de la jointure de la partie:', error);
        alert('Erreur lors de la jointure de la partie');
    }
}); 