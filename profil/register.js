// profil/register.js
import { registerWithUsername, db } from '../js/config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('register-form');
    const q1Select = document.getElementById('question-1');
    const q2Select = document.getElementById('question-2');
    const errorZone = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // 1. Gestion des petits yeux pour voir le mot de passe
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });

    // 2. Éviter de choisir la même question dans les deux listes déroulantes
    function updateQuestions() {
        const val1 = q1Select.value;
        const val2 = q2Select.value;

        // Réinitialise l'affichage des options de la question 2
        Array.from(q2Select.options).forEach(opt => {
            if (opt.value !== "" && opt.value === val1) {
                opt.style.display = 'none';
            } else {
                opt.style.display = 'block';
            }
        });

        // Réinitialise l'affichage des options de la question 1
        Array.from(q1Select.options).forEach(opt => {
            if (opt.value !== "" && opt.value === val2) {
                opt.style.display = 'none';
            } else {
                opt.style.display = 'block';
            }
        });
    }

    q1Select.addEventListener('change', updateQuestions);
    q2Select.addEventListener('change', updateQuestions);

    // 3. Soumission et enregistrement Firestore
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-submit');
        const firstname = document.getElementById('firstname').value.trim();
        const lastname = document.getElementById('lastname').value.trim();
        const username = document.getElementById('username').value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        const question1 = q1Select.value;
        const answer1 = document.getElementById('answer-1').value.trim().toLowerCase();
        const question2 = q2Select.value;
        const answer2 = document.getElementById('answer-2').value.trim().toLowerCase();

        errorZone.classList.add('hidden');

        // Validation des mots de passe
        if (password !== confirmPassword) {
            errorZone.classList.remove('hidden');
            errorText.textContent = "Les deux mots de passe ne correspondent pas.";
            return;
        }

        // Validation de la longueur du mot de passe
        if (password.length < 6) {
            errorZone.classList.remove('hidden');
            errorText.textContent = "Le secret doit contenir au moins 6 caractères.";
            return;
        }

        btn.disabled = true;
        btn.querySelector('span').textContent = "CRÉATION EN COURS...";

        try {
            // Création de l'utilisateur dans Firebase Auth
            const user = await registerWithUsername(username, password);

            // Structure du document profil sur Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                firstname: firstname,
                lastname: lastname,
                username: username,
                createdAt: new Date().toISOString(),
                security: {
                    q1: question1,
                    a1: answer1,
                    q2: question2,
                    a2: answer2
                }
            });

            // Sauvegarde de session locale pour l'accueil et redirection immédiate
            localStorage.setItem('valo_user_name', firstname);
            window.location.href = "../dashboard.html";

        } catch (error) {
            errorZone.classList.remove('hidden');
            if (error.message.includes("email-already-in-use")) {
                errorText.textContent = "Ce nom d'utilisateur est déjà utilisé.";
            } else {
                errorText.textContent = "Erreur système : Impossible de créer le profil.";
            }
            console.error(error);
        } finally {
            btn.disabled = false;
            btn.querySelector('span').textContent = "Créer mon compte";
        }
    });
});
