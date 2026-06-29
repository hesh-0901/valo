// js/dashboard.js
import { auth } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const welcomeName = document.getElementById('welcome-name');
    const periodBadge = document.getElementById('current-period');
    const logOutButtons = document.querySelectorAll('.btn-logout');
    
    // Filtres temporels
    const filterIncome = document.getElementById('filter-income');
    const filterExpenses = document.getElementById('filter-expenses');

    // 1. Affichage de la période générale en haut de l'écran
    const options = { month: 'long', year: 'numeric' };
    const currentPeriodText = new Date().toLocaleDateString('fr-FR', options);
    periodBadge.textContent = currentPeriodText.charAt(0).toUpperCase() + currentPeriodText.slice(1);

    // 2. Écouteurs des filtres de cartes (Mois / Année)
    if (filterIncome) {
        filterIncome.addEventListener('change', (e) => {
            fetchFilteredData('income', e.target.value);
        });
    }

    if (filterExpenses) {
        filterExpenses.addEventListener('change', (e) => {
            fetchFilteredData('expenses', e.target.value);
        });
    }

    // 3. Surveillance de l'état de connexion de l'utilisateur
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const email = user.email || "";
            const username = email.split('@')[0];
            const cleanName = username.charAt(0).toUpperCase() + username.slice(1);

            welcomeName.textContent = cleanName;
            
            // Remplissage des avatars et pseudos
            document.querySelectorAll('.profile-name').forEach(el => el.textContent = cleanName);
            document.querySelectorAll('.md-avatar, .mobile-avatar').forEach(el => el.textContent = cleanName.charAt(0));
            
            // Premier chargement par défaut (mode mois)
            fetchFilteredData('income', 'month');
            fetchFilteredData('expenses', 'month');
        } else {
            window.location.href = "./index.html";
        }
    });

    // 4. Gestion de la déconnexion
    logOutButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = "./index.html";
            } catch (error) {
                console.error("Erreur de déconnexion :", error);
            }
        });
    });
});

/**
 * Fonction pour charger les données filtrées depuis Firestore (ou locale)
 * @param {string} type - 'income' ou 'expenses'
 * @param {string} range - 'month' ou 'year'
 */
async function fetchFilteredData(type, range) {
    console.log(`Filtrage demandé pour les ${type} sur la période : ${range}`);
    
    // Détermination de la date de départ
    const now = new Date();
    let startFilterDate;

    if (range === 'month') {
        startFilterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        startFilterDate = new Date(now.getFullYear(), 0, 1);
    }

    try {
        // C'est ici que tu intégreras tes requêtes Firestore cumulatives.
        // Exemple : const q = query(collection(db, "flux"), ...);
        
        // Similairement à tes données d'entrées d'origine, on simule l'affichage :
        if (type === 'income') {
            document.getElementById('monthly-income').textContent = range === 'month' ? "4 250,00 $" : "48 900,00 $";
        } else {
            document.getElementById('monthly-expenses').textContent = range === 'month' ? "1 810,00 $" : "19 430,00 $";
        }

    } catch (error) {
        console.error("Erreur lors du traitement du filtre :", error);
    }
}
