import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chemin vers le fichier gutenberg.txt dans le dossier public
const gutenbergPath = path.join(__dirname, '..', 'public', 'gutenberg.txt');

try {
    // Lire le fichier
    console.log('Lecture du fichier gutenberg.txt...');
    const content = fs.readFileSync(gutenbergPath, 'utf8');
    
    // Traiter les mots
    console.log('Traitement des mots...');
    const words = content
        .split('\n')
        .map(word => word.trim())
        .filter(word => word) // Enlever les lignes vides
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliser
        .sort() // Trier alphabétiquement
        .filter((word, index, array) => array.indexOf(word) === index); // Enlever les doublons
    
    // Écrire le fichier formaté
    console.log('Écriture du fichier formaté...');
    fs.writeFileSync(gutenbergPath, words.join('\n'));
    
    console.log('Terminé !');
    console.log(`Nombre de mots traités : ${words.length}`);
} catch (error) {
    console.error('Erreur lors du traitement du fichier :', error);
} 