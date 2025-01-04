import { auth, db } from './config/firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let currentUser = null;

// Vérification de l'authentification
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './index.html';
    } else {
        currentUser = user;
        loadUserData(user.uid);
        loadScores();
    }
});

// Chargement des données utilisateur
async function loadUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        
        // Afficher le pseudo
        document.getElementById('userPseudo').textContent = userData.pseudo;
        
        // Récupérer les statistiques
        const stats = userData.scores || {
            gamesPlayed: 0,
            victories: 0,
            defeats: 0,
            winRate: 0
        };
        
        // Afficher les statistiques
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed || '-';
        document.getElementById('victories').textContent = stats.victories || '-';
        document.getElementById('defeats').textContent = stats.defeats || '-';
        document.getElementById('totalPoints').textContent = userData.totalScore || '-';
        document.getElementById('winRate').textContent = stats.winRate ? `${stats.winRate}%` : '-';
        
        // Calculer et afficher la position (à implémenter plus tard avec le classement)
        const position = await calculateUserPosition(userId);
        document.getElementById('position').textContent = position || '-';
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
    }
}

// Calculer la position du joueur
async function calculateUserPosition(userId) {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        
        usersSnapshot.forEach(doc => {
            users.push({
                id: doc.id,
                totalScore: doc.data().totalScore || 0
            });
        });
        
        // Trier les utilisateurs par score total décroissant
        users.sort((a, b) => b.totalScore - a.totalScore);
        
        // Trouver la position du joueur actuel
        const position = users.findIndex(user => user.id === userId) + 1;
        return position;
    } catch (error) {
        console.error('Erreur lors du calcul de la position:', error);
        return '-';
    }
}

// Chargement des scores
async function loadScores(period = 'all') {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const scores = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            scores.push({
                id: doc.id,
                pseudo: userData.pseudo,
                gamesPlayed: userData.scores?.gamesPlayed || 0,
                victories: userData.scores?.victories || 0,
                totalPoints: userData.totalScore || 0,
                moyenne: userData.scores?.gamesPlayed ? 
                    Math.round(userData.totalScore / userData.scores.gamesPlayed) : 0
            });
        });

        // Trier les scores par points totaux décroissants
        scores.sort((a, b) => b.totalPoints - a.totalPoints);

        // Mettre à jour le tableau
        const tbody = document.getElementById('scoresTableBody');
        tbody.innerHTML = '';

        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            if (score.id === auth.currentUser.uid) {
                row.classList.add('current-user');
            }

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.pseudo}</td>
                <td>${score.gamesPlayed}</td>
                <td>${score.victories}</td>
                <td>${score.totalPoints}</td>
                <td>${score.moyenne}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des scores:', error);
    }
}

// Mise à jour du tableau des scores
function updateScoresTable(scores) {
    const tbody = document.getElementById('scoresTableBody');
    tbody.innerHTML = '';

    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        if (score.id === currentUser.uid) {
            row.classList.add('current-user');
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.pseudo}</td>
            <td>${score.gamesPlayed || 0}</td>
            <td>${score.victories || 0}</td>
            <td>${score.totalPoints || 0}</td>
            <td>${calculateAverage(score.totalPoints, score.gamesPlayed)}</td>
        `;

        tbody.appendChild(row);
    });
}

// Mise à jour des statistiques personnelles
function updatePersonalStats(userData, rank) {
    document.getElementById('playerRank').textContent = rank;
    document.getElementById('gamesPlayed').textContent = userData.gamesPlayed || 0;
    document.getElementById('victories').textContent = userData.victories || 0;
    document.getElementById('totalPoints').textContent = userData.totalPoints || 0;
}

// Calcul de la moyenne
function calculateAverage(points, games) {
    if (!games || games === 0) return '0';
    return (points / games).toFixed(1);
}

// Gestion du filtre de période
document.getElementById('periodFilter').addEventListener('change', (e) => {
    loadScores(e.target.value);
});

// Gestion de la déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = './index.html';
    } catch (error) {
        alert('Erreur lors de la déconnexion : ' + error.message);
    }
}); 