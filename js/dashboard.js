// js/dashboard.js
import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUid = null;
let activeRange = 'month'; // Filtre de temps par défaut

document.addEventListener("DOMContentLoaded", () => {
    const welcomeName = document.getElementById('welcome-name');
    const optCurrentMonth = document.getElementById('opt-current-month');
    const globalRangeFilter = document.getElementById('global-range-filter');
    const logOutButtons = document.querySelectorAll('.btn-logout');

    // 1. Label dynamique du mois actuel dans le sélecteur
    const options = { month: 'long' };
    const currentMonthName = new Date().toLocaleDateString('fr-FR', options);
    if (optCurrentMonth) {
        optCurrentMonth.textContent = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
    }

    // 2. Gestion de l'écouteur du filtre de temps global (Uniquement pour Entrées/Sorties)
    if (globalRangeFilter) {
        globalRangeFilter.addEventListener('change', (e) => {
            activeRange = e.target.value;
            if (currentUid) {
                loadFinancialData(currentUid, activeRange);
            }
        });
    }

    // 3. Cycle de vie de l'authentification
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUid = user.uid;
            const email = user.email || "";
            const username = email.split('@')[0];
            const cleanName = username.charAt(0).toUpperCase() + username.slice(1);

            if (welcomeName) welcomeName.textContent = cleanName;
            document.querySelectorAll('.profile-name').forEach(el => el.textContent = cleanName);
            document.querySelectorAll('.md-avatar, .mobile-avatar').forEach(el => el.textContent = cleanName.charAt(0));
            
            // Chargement de la base de données pour cet utilisateur
            loadFinancialData(currentUid, activeRange);
        } else {
            window.location.href = "./index.html";
        }
    });

    // 4. Action de déconnexion
    logOutButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = "./index.html";
            } catch (error) {
                console.error("Erreur déconnexion :", error);
            }
        });
    });
});

/**
 * Charge, calcule et écoute en temps réel les données de la base de données Firestore
 * @param {string} uid - Identifiant unique de l'utilisateur connecté
 * @param {string} range - Échelle de temps : 'month' ou 'year'
 */
function loadFinancialData(uid, range) {
    const transactionsRef = collection(db, "transactions");
    
    // Requête globale pour l'historique de l'utilisateur (Trié par date décroissante)
    const globalQuery = query(transactionsRef, where("uid", "==", uid), orderBy("date", "desc"));

    // Écoute temps réel de l'intégralité des flux pour le Solde Total et l'historique
    onSnapshot(globalQuery, (snapshot) => {
        let totalBalance = 0;
        let filteredIncome = 0;
        let filteredExpenses = 0;
        let transactionsHTML = "";

        // Détermination des limites de date pour le filtre (Mois ou Année en cours)
        const now = new Date();
        const startOfPeriod = range === 'month' 
            ? new Date(now.getFullYear(), now.getMonth(), 1) 
            : new Date(now.getFullYear(), 0, 1);

        let count = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const transactionAmount = parseFloat(data.amount) || 0;
            const transactionDate = new Date(data.date);

            // A. CALCUL DU SOLDE TOTAL (Toujours global, immuable face aux filtres)
            if (data.type === 'income') {
                totalBalance += transactionAmount;
            } else if (data.type === 'expense') {
                totalBalance -= transactionAmount;
            }

            // B. CALCUL DES ENTRÉES & SORTIES FILTRÉES TEMPORELLEMENT
            if (transactionDate >= startOfPeriod) {
                if (data.type === 'income') {
                    filteredIncome += transactionAmount;
                } else if (data.type === 'expense') {
                    filteredExpenses += transactionAmount;
                }
            }

            // C. CONSTRUCTION DU COMPOSANT VISUEL DES FLUX RÉCENTS (Limité aux 4 derniers)
            if (count < 4) {
                const isIncome = data.type === 'income';
                const formattedDate = transactionDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                
                transactionsHTML += `
                    <div class="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs ${isIncome ? 'bg-valoMint/10 text-valoMint' : 'bg-valoCrimson/10 text-valoCrimson'}">
                                <i class="${isIncome ? 'bi bi-arrow-down-left' : 'bi bi-arrow-up-right'}"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-200">${data.description || (isIncome ? 'Revenu' : 'Dépense')}</p>
                                <span class="text-[10px] text-valoSlate font-medium font-mono">${formattedDate}</span>
                            </div>
                        </div>
                        <span class="text-xs font-mono font-bold ${isIncome ? 'text-valoMint' : 'text-slate-300'}">
                            ${isIncome ? '+' : '-'} ${transactionAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                        </span>
                    </div>
                `;
                count++;
            }
        });

        // 4. Injection des valeurs calculées dynamiquement dans l'interface
        document.getElementById('total-balance').textContent = `${totalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
        document.getElementById('monthly-income').textContent = `${filteredIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
        document.getElementById('monthly-expenses').textContent = `${filteredExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;

        // Remplissage ou message vide pour la liste des transactions
        const listContainer = document.getElementById('transactions-list');
        if (transactionsHTML !== "") {
            listContainer.innerHTML = transactionsHTML;
        } else {
            listContainer.innerHTML = `
                <div class="p-4 text-center text-sm text-valoSlate py-8">
                    <i class="bi bi-inbox text-2xl block mb-2 opacity-50"></i>
                    Aucune opération enregistrée pour cette période.
                </div>
            `;
        }
    }, (error) => {
        console.error("Erreur Firestore (Vérifie tes indexes ou tes règles) :", error);
    });
}
