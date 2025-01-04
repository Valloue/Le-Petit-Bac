import { auth, db } from '../config/firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const registerForm = document.getElementById('registerForm');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

const passwordRequirements = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
    length: /.{10,}/
};

function validatePassword(password) {
    const requirements = {
        uppercase: passwordRequirements.uppercase.test(password),
        lowercase: passwordRequirements.lowercase.test(password),
        number: passwordRequirements.number.test(password),
        special: passwordRequirements.special.test(password),
        length: passwordRequirements.length.test(password)
    };

    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(req);
        if (requirements[req]) {
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
        }
    });

    return Object.values(requirements).every(Boolean);
}

passwordInput.addEventListener('input', () => {
    validatePassword(passwordInput.value);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pseudo = document.getElementById('pseudo').value;
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!validatePassword(password)) {
        alert('Le mot de passe ne respecte pas les critères requis');
        return;
    }

    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Créer le profil utilisateur dans Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            pseudo: pseudo,
            email: email,
            createdAt: new Date().toISOString(),
            scores: []
        });

        window.location.href = './dashboard.html';
    } catch (error) {
        alert('Erreur lors de l\'inscription : ' + error.message);
    }
}); 