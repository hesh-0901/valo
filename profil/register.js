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

        Array.from(q2Select.options).forEach(opt => {
            opt.style.display = (opt.value !== "" && opt.value === val1) ? 'none' : 'block';
        });

        Array.from(q1Select.options).forEach(opt => {
            opt.style.display = (opt.value !== "" && opt.value === val2) ? 'none' : 'block';
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

        if (password !== confirmPassword) {
            errorZone.classList.remove('hidden');
            errorText.textContent = "Les deux mots de passe ne correspondent pas.";
            return;
        }

        if (password.length < 6) {
            errorZone.classList.remove('hidden');
            errorText.textContent = "Le secret doit contenir au moins 6 caractères.";
            return;
        }

        btn.disabled = true;
        btn.querySelector('span').textContent = "CRÉATION EN COURS...";

        try {
            // Étape A : Création dans Firebase Auth
            const user = await registerWithUsername(username, password);

            // Étape B : Écriture dans Firestore (Création automatique de la collection et du document)
            try {
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

                // Étape C : Succès complet, stockage local et redirection
                localStorage.setItem('valo_user_name', firstname);
                window.location.href = "../dashboard.html";

            } catch (firestoreError) {
                // Si l'auth a réussi mais que Firestore bloque (Règles de sécurité non publiées ou mauvaise config)
                console.error("Détails de l'erreur Firestore :", firestoreError);
                errorZone.classList.remove('hidden');
                errorText.textContent = `Compte créé, mais liaison base de données refusée : ${firestoreError.message}`;
            }

        } catch (authError) {
            errorZone.classList.remove('hidden');
            if (authError.message.includes("email-already-in-use")) {
                errorText.textContent = "Ce nom d'utilisateur est déjà utilisé.";
            } else {
                errorText.textContent = `Erreur d'authentification : ${authError.message}`;
            }
            console.error(authError);
        } finally {
            btn.disabled = false;
            btn.querySelector('span').textContent = "Créer mon compte";
        }
    });
});
