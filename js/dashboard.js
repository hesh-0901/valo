// js/dashboard.js
import { auth } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const welcomeName = document.getElementById('welcome-name');
    const optCurrentMonth = document.getElementById('opt-current-month');
    const globalRangeFilter = document.getElementById('global-range-filter');
    const logOutButtons = document.querySelectorAll('.btn-logout');

    // 1. Personnalisation du texte de la première option du filtre avec le mois en cours
    const options = { month: 'long' };
    const currentMonthName = new Date().toLocaleDateString('fr-FR', options);
    if (optCurrentMonth) {
        // Met la première lettre en majuscule (ex: "Juillet")
        optCurrentMonth.textContent = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
    }

    // 2. Gestion de l'écouteur du filtre global unifié
    if (globalRangeFilter) {
        globalRangeFilter.addEventListener('change', (e) => {
            const selectedRange = e.target.value; // Renvoie 'month' ou 'year'
            updateFinancialDashboard(selectedRange);
        });
    }

    // 3. Suivi en temps réel de la connexion de l'utilisateur
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Nettoyage de l'email pour obtenir le pseudo (ex: henoch@valo.local -> Henoch)
            const email = user.email || "";
            const username = email.split('@')[0];
            const cleanName = username.charAt(0).toUpperCase() + username.slice(1);

            // Injection des informations utilisateur dans le DOM
            if (welcomeName) welcomeName.textContent = cleanName;
            
            document.querySelectorAll('.profile-name').forEach(el => el.textContent = cleanName);
            document.querySelectorAll('.md-avatar, .mobile-avatar').forEach(el => el.textContent = cleanName.charAt(0));
            
            // Chargement initial des données financières en mode "Mois"
            updateFinancialDashboard('month');
        } else {
            // Redirection vers l'index si aucun utilisateur n'est connecté
            window.location.href = "./index.html";
        }
    });

    // 4. Attribution de la logique de déconnexion aux boutons (Desktop & Mobile)
    logOutButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = "./index.html";
            } catch (error) {
                console.error("Erreur lors de la tentative de déconnexion :", error);
            }
        });
    });
});

/**
 * Calcule et met à jour l'affichage des flux entrants et sortants simultanément.
 * @param {string} range - Échelle de temps choisie : 'month' ou 'year'
 */
async function updateFinancialDashboard(range) {
    console.log(`[VALO Base] Interrogation des tables financières. Période : ${range}`);
    
    try {
        // TODO : Remplacer les simulations ci-dessous par vos calculs/requêtes Cloud Firestore cumulées.
        if (range === 'month') {
            // Affichage des données financières mensuelles courantes
            document.getElementById('monthly-income').textContent = "4 250,00 $";
            document.getElementById('monthly-expenses').textContent = "1 810,00 $";
            document.getElementById('total-balance').textContent = "2 440,00 $";
        } else {
            // Affichage des données financières cumulées annuelles
            document.getElementById('monthly-income').textContent = "48 900,00 $";
            document.getElementById('monthly-expenses').textContent = "19 430,00 $";
            document.getElementById('total-balance').textContent = "29 470,00 $";
        }
    } catch (err) {
        console.error("Impossible de rafraîchir les cartes financières :", err);
    }
}
