import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/config', express.static(path.join(__dirname, 'config')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'auth.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'dashboard.html'));
});

app.get('/scores', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'scores.html'));
});

app.get('/rules', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'rules.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'game.html'));
});

app.get('/create-game', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'create-game.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.redirect('/');
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    console.log(`L'application est également accessible sur http://127.0.0.1:${port}`);
}); 