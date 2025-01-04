import { auth, db } from './config/firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let currentGame = null;
let timerInterval = null;
let dictionary = null;
let gameListener = null;

// Récupérer l'ID de la partie depuis le sessionStorage
const gameId = sessionStorage.getItem('currentGameId');

// Charger le dictionnaire au démarrage
async function loadDictionary() {
    try {
        const response = await fetch('/gutenberg.txt');
        const text = await response.text();
        console.log('Dictionnaire chargé avec succès');
        console.log('Premier mot du dictionnaire:', text.split('\n')[0]);
        console.log('Nombre de mots dans le dictionnaire:', text.split('\n').length);
        dictionary = new Set(
            text.split('\n')
                .map(word => word.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
                .filter(word => word)
        );
    } catch (error) {
        console.error('Erreur lors du chargement du dictionnaire:', error);
        alert('Erreur lors du chargement du dictionnaire');
    }
}

// Vérification de l'authentification
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = './index.html';
    } else {
        await loadDictionary();
        await loadUserData(user.uid);
        if (gameId) {
            await loadGameData(gameId);
            // Nettoyer le sessionStorage après avoir chargé les données
            sessionStorage.removeItem('currentGameId');
        } else {
            window.location.href = './dashboard.html';
        }
    }
});

// Chargement des données utilisateur
async function loadUserData(userId) {
    const userDoc = await doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    const userData = userSnap.data();
    document.getElementById('userPseudo').textContent = userData.pseudo;
}

// Chargement des données de la partie
async function loadGameData(gameId) {
    try {
        const gameDoc = doc(db, 'games', gameId);
        
        // Mettre en place l'écouteur en temps réel
        if (gameListener) {
            gameListener();
        }
        
        gameListener = onSnapshot(gameDoc, (gameSnap) => {
            if (gameSnap.exists()) {
                const newGameData = { id: gameSnap.id, ...gameSnap.data() };
                
                // Sauvegarder les valeurs actuelles des inputs avant la mise à jour
                const currentInputs = {};
                if (currentGame && currentGame.status === 'active') {
                    document.querySelectorAll('.answer-input').forEach(input => {
                        currentInputs[input.dataset.category] = input.value;
                    });
                }
                
                // Si c'est la première fois qu'on charge la partie
                if (!currentGame) {
                    currentGame = newGameData;
                    
                    // D'abord afficher les informations de la partie
                    displayGameInfo();
                    
                    // Ensuite démarrer le timer si nécessaire
                    if (currentGame.timer && currentGame.timer.enabled && currentGame.status === 'active') {
                        const startTime = new Date(currentGame.createdAt).getTime();
                        const elapsed = Math.floor((Date.now() - startTime) / 1000);
                        const remainingTime = Math.max(0, currentGame.timer.duration - elapsed);
                        if (remainingTime > 0) {
                            startTimer(remainingTime);
                        } else {
                            endGame();
                        }
                    }
                } else {
                    // Mise à jour du statut de la partie
                    if (newGameData.status !== currentGame.status) {
                        if (newGameData.status === 'completed') {
                            clearInterval(timerInterval);
                        }
                    }
                    currentGame = newGameData;
                    displayGameInfo();
                }
                
                // Restaurer les valeurs des inputs après la mise à jour
                if (Object.keys(currentInputs).length > 0) {
                    document.querySelectorAll('.answer-input').forEach(input => {
                        if (currentInputs[input.dataset.category]) {
                            input.value = currentInputs[input.dataset.category];
                        }
                    });
                }
            } else {
                alert('Cette partie n\'existe pas');
                window.location.href = '/dashboard';
            }
        }, (error) => {
            console.error('Erreur lors de l\'écoute de la partie:', error);
            alert('Erreur lors de la synchronisation de la partie');
        });

    } catch (error) {
        console.error('Erreur lors du chargement de la partie:', error);
        alert('Erreur lors du chargement de la partie');
        window.location.href = '/dashboard';
    }
}

// Affichage des informations de la partie
function displayGameInfo() {
    const gameInfo = document.getElementById('gameInfo');
    gameInfo.innerHTML = `
        <h1>${currentGame.title}</h1>
        <div class="game-details">
            <div class="current-letter">
                <h3>Lettre à utiliser</h3>
                <span class="letter">${currentGame.currentLetter}</span>
            </div>
            <p>Catégories : ${currentGame.categories.join(', ')}</p>
            <p>Joueurs : ${currentGame.participants.length}</p>
            <p>Statut : ${currentGame.status === 'active' ? 'En cours' : 'Terminée'}</p>
            ${currentGame.timer?.enabled ? `
                <div class="timer-display">
                    <p>Temps restant : <span id="timer">00:00</span></p>
                </div>
            ` : ''}
        </div>
    `;

    // Ajout de la grille de réponses
    const gameContent = document.getElementById('gameContent');
    gameContent.innerHTML = currentGame.status === 'active' ? `
        <div class="answers-grid">
            ${currentGame.categories.map(category => `
                <div class="answer-card">
                    <label for="${category}">${category}</label>
                    <div class="answer-input-container">
                        <input type="text" 
                            id="${category}"
                            class="answer-input"
                            placeholder="Mot en ${currentGame.currentLetter}..."
                            data-category="${category}">
                        <span class="letter-prefix">${currentGame.currentLetter}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="game-actions">
            <button id="submitAnswers" class="primary-button">Vérifier mes réponses</button>
        </div>
    ` : `
        ${currentGame.results ? `
            <div class="results-section">
                <h2>Résultats de la partie</h2>
                <div class="results-grid">
                    ${Object.entries(currentGame.results).map(([userId, result]) => `
                        <div class="player-results">
                            <h3>${result.pseudo}</h3>
                            <p class="total-points">Total : ${result.totalPoints} points</p>
                            <div class="answers-results">
                                ${Object.entries(result.answers).map(([category, answer]) => `
                                    <div class="answer-result ${
                                        !answer.valid ? 'invalid' : answer.points === 2 ? 'unique' : 'common'
                                    }">
                                        <span class="category">${category}</span>
                                        <span class="word">${answer.word || '-'}</span>
                                        <span class="points">
                                            ${answer.valid ? 
                                                `${answer.points} pt${answer.points > 1 ? 's' : ''}` : 
                                                'Mot invalide'}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    // Ajouter les écouteurs d'événements pour les inputs
    if (currentGame.status === 'active') {
        setupAnswerInputs();
    }
}

// Configuration des inputs de réponse
function setupAnswerInputs() {
    const inputs = document.querySelectorAll('.answer-input');
    const submitButton = document.getElementById('submitAnswers');
    
    inputs.forEach(input => {
        // Force la première lettre en majuscule et égale à la lettre tirée
        input.addEventListener('input', (e) => {
            let value = e.target.value;
            if (value.length > 0) {
                if (value[0].toUpperCase() !== currentGame.currentLetter) {
                    value = currentGame.currentLetter + value.slice(1);
                }
                value = value[0].toUpperCase() + value.slice(1).toLowerCase();
            }
            e.target.value = value;
        });
        
        // Sauvegarder la réponse quand le joueur quitte le champ
        input.addEventListener('blur', (e) => {
            saveAnswer(input.dataset.category, e.target.value);
        });
    });
    
    submitButton?.addEventListener('click', submitAnswers);
}

// Soumission des réponses
async function submitAnswers() {
    if (!confirm('Êtes-vous sûr de vouloir terminer la partie et vérifier les réponses ?')) {
        return;
    }

    // Utiliser la même fonction que pour la fin du timer
    await endGame();
}

// Fonction pour sauvegarder une réponse
async function saveAnswer(category, value) {
    try {
        const gameRef = doc(db, 'games', currentGame.id);
        if (currentGame.status !== 'active') return;
        
        // Vérifier si la valeur a changé
        const currentValue = currentGame.participants[auth.currentUser.uid]?.[category];
        if (currentValue === value) return;
        
        // Mise à jour de la réponse dans la structure participants
        await updateDoc(gameRef, {
            [`participants.${auth.currentUser.uid}.${category}`]: value
        });
        
        // Mettre à jour la version locale
        if (!currentGame.participants[auth.currentUser.uid]) {
            currentGame.participants[auth.currentUser.uid] = {};
        }
        currentGame.participants[auth.currentUser.uid][category] = value;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la réponse:', error);
    }
}

// Terminer la partie
async function endGame() {
    try {
        const gameRef = doc(db, 'games', currentGame.id);
        
        const gameSnap = await getDoc(gameRef);
        const gameData = gameSnap.data();
        
        // Calculer les points pour chaque réponse
        const results = await calculateResults(gameData.participants);
        
        // Déterminer le gagnant (celui avec le plus de points)
        let winner = null;
        let maxPoints = -1;
        
        // Trouver le gagnant
        for (const [userId, result] of Object.entries(results)) {
            if (result.totalPoints > maxPoints) {
                maxPoints = result.totalPoints;
                winner = userId;
            }
        }
        
        // Mettre à jour la partie avec les résultats
        await updateDoc(gameRef, {
            status: 'completed',
            endedAt: new Date().toISOString(),
            results: results
        });
        
        // Mettre à jour les statistiques de chaque joueur
        for (const [userId, result] of Object.entries(results)) {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data() || {};
            
            // S'assurer que la structure scores existe
            if (!userData.scores) {
                await updateDoc(userRef, {
                    scores: {
                        gamesPlayed: 0,
                        victories: 0,
                        defeats: 0,
                        winRate: 0
                    }
                });
            }
            
            // Récupérer les statistiques à jour
            const freshUserDoc = await getDoc(userRef);
            const currentStats = freshUserDoc.data().scores || {
                gamesPlayed: 0,
                victories: 0,
                defeats: 0,
                winRate: 0
            };
            
            // Mettre à jour les statistiques
            const newStats = {
                gamesPlayed: currentStats.gamesPlayed + 1,
                victories: currentStats.victories + (userId === winner ? 1 : 0),
                defeats: currentStats.defeats + (userId === winner ? 0 : 1),
                winRate: 0 // Sera calculé juste après
            };
            
            // Calculer le nouveau pourcentage de victoires
            newStats.winRate = Math.round((newStats.victories / newStats.gamesPlayed) * 100) || 0;
            
            await updateDoc(userRef, {
                totalScore: (result.totalPoints || 0) + (freshUserDoc.data().totalScore || 0),
                scores: newStats
            });
        }
        
        alert('La partie est terminée !');
        await loadGameData(currentGame.id);
    } catch (error) {
        console.error('Erreur lors de la fin de la partie:', error);
        alert('Erreur lors de la fin de la partie');
    }
}

// Calcul des résultats
async function calculateResults(participants) {
    console.log('Début du calcul des résultats');
    const results = {};
    const wordCounts = {};
    
    // Compter les occurrences de chaque mot par catégorie
    for (const userId of Object.keys(participants)) {
        const playerAnswers = participants[userId] || {};
        for (const [category, word] of Object.entries(playerAnswers)) {
            if (!wordCounts[category]) {
                wordCounts[category] = {};
            }
            if (word && word.trim()) {
                const normalizedWord = word.trim().toLowerCase();
                wordCounts[category][normalizedWord] = (wordCounts[category][normalizedWord] || 0) + 1;
            }
        }
    }
    
    // Calculer les points pour chaque participant
    for (const userId of Object.keys(participants)) {
        const playerAnswers = participants[userId] || {};
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                console.error(`Utilisateur ${userId} non trouvé`);
                continue;
            }
            const userData = userDoc.data();
            if (!userData) {
                console.error(`Données utilisateur non trouvées pour ${userId}`);
                continue;
            }
            
            results[userId] = {
                pseudo: userData.pseudo || 'Joueur inconnu',
                totalPoints: 0,
                answers: {}
            };
            
            for (const category of currentGame.categories) {
                const word = playerAnswers[category] || '';
                const normalizedWord = word.trim().toLowerCase();
                let points = 0;
                
                if (normalizedWord && dictionary.has(normalizedWord)) {
                    points = wordCounts[category][normalizedWord] === 1 ? 2 : 1;
                }
                
                results[userId].answers[category] = {
                    word: word || '-',
                    points: points,
                    valid: dictionary.has(normalizedWord)
                };
                
                results[userId].totalPoints += points;
            }
        } catch (error) {
            console.error(`Erreur lors du calcul des points pour ${userId}:`, error);
            // Continuer avec le prochain joueur
            continue;
        }
    }
    
    return results;
}

// Gestion du timer
function updateTimerDisplay(timeLeft) {
    const timerElement = document.getElementById('timer');
    if (!timerElement) {
        console.error('Élément timer non trouvé');
        return;
    }
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer(duration) {
    const timerElement = document.getElementById('timer');
    if (!timerElement) {
        console.error('Élément timer non trouvé, impossible de démarrer le timer');
        return;
    }

    // Nettoyer l'ancien timer si existant
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    let timeLeft = duration;
    updateTimerDisplay(timeLeft);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
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

// Nettoyage du timer lors du déchargement de la page
window.addEventListener('beforeunload', () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    if (gameListener) {
        gameListener();
    }
}); 