// js/dashboard.js
import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUid = null;
let activeRange = 'month'; 

document.addEventListener("DOMContentLoaded", () => {
    const welcomeName = document.getElementById('welcome-name');
    const optCurrentMonth = document.getElementById('opt-current-month');
    const globalRangeFilter = document.getElementById('global-range-filter');
    const logOutButtons = document.querySelectorAll('.btn-logout');
    
    // Éléments d'injection
    const btnOpenRevenu = document.getElementById('btn-open-revenu');
    const btnOpenSortie = document.getElementById('btn-open-sortie');
    const modalContainer = document.getElementById('modal-container');

    const options = { month: 'long' };
    const currentMonthName = new Date().toLocaleDateString('fr-FR', options);
    if (optCurrentMonth) optCurrentMonth.textContent = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    if (globalRangeFilter) {
        globalRangeFilter.addEventListener('change', (e) => {
            activeRange = e.target.value;
            if (currentUid) loadFinancialData(currentUid, activeRange);
        });
    }

    // ==========================================
        // CHARGEMENT SYSTEME ASYNCHRONE DES COMPOSANTS MODALS
        // ==========================================
        btnOpenRevenu.addEventListener('click', async () => {
            if (!currentUid) return;
            try {
                // 1. Récupération et injection du HTML isolé
                const response = await fetch('./modal/revenu.html');
                modalContainer.innerHTML = await response.text();
                
                // 2. Importation dynamique avec le chemin d'accès absolu depuis la racine
                const moduleRevenu = await import('../modal/js/revenu.js');
                
                // 3. Simulation des données (À remplacer plus tard par tes données Firebase)
                const rubriquesDeTest = ["Vente", "UI/UX Design", "Import"];
                const partenairesDeTest = ["Samuel Kalenga", "Vianelle", "Japhète"];
                const tauxDuMoment = 2850; 
    
                // 4. Initialisation du comportement complet du modal (Devise, Tags, Recherche, Croix)
                moduleRevenu.initRevenuModal(rubriquesDeTest, partenairesDeTest, tauxDuMoment);
                
            } catch (err) { 
                console.error("Échec chargement modal revenu", err); 
            }
        });
    // Reste du cycle Firebase global
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUid = user.uid;
            const email = user.email || "";
            const cleanName = (email.split('@')[0]).charAt(0).toUpperCase() + (email.split('@')[0]).slice(1);
            if (welcomeName) welcomeName.textContent = cleanName;
            document.querySelectorAll('.profile-name').forEach(el => el.textContent = cleanName);
            document.querySelectorAll('.md-avatar, .mobile-avatar').forEach(el => el.textContent = cleanName.charAt(0));
            loadFinancialData(currentUid, activeRange);
        } else {
            window.location.href = "./index.html";
        }
    });

    logOutButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            try { await signOut(auth); window.location.href = "./index.html"; } catch (error) { console.error(error); }
        });
    });
});

function loadFinancialData(uid, range) {
    const transactionsRef = collection(db, "transactions");
    const globalQuery = query(transactionsRef, where("uid", "==", uid), orderBy("date", "desc"));

    onSnapshot(globalQuery, (snapshot) => {
        let totalBalance = 0, filteredIncome = 0, filteredExpenses = 0, transactionsHTML = "";
        const now = new Date();
        const startOfPeriod = range === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), 0, 1);
        let count = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const amt = parseFloat(data.amount) || 0;
            const txDate = new Date(data.date);

            if (data.type === 'income') totalBalance += amt;
            else if (data.type === 'expense') totalBalance -= amt;

            if (txDate >= startOfPeriod) {
                if (data.type === 'income') filteredIncome += amt;
                else if (data.type === 'expense') filteredExpenses += amt;
            }

            if (count < 4) {
                const isInc = data.type === 'income';
                transactionsHTML += `
                    <div class="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs ${isInc ? 'bg-valoMint/10 text-valoMint' : 'bg-valoCrimson/10 text-valoCrimson'}">
                                <i class="${isInc ? 'bi bi-arrow-down-left' : 'bi bi-arrow-up-right'}"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-200">${data.description || ''}</p>
                                <span class="text-[10px] text-valoSlate font-mono">${txDate.toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}</span>
                            </div>
                        </div>
                        <span class="text-xs font-mono font-bold ${isInc ? 'text-valoMint' : 'text-slate-300'}">
                            ${isInc ? '+' : '-'} ${amt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                        </span>
                    </div>`;
                count++;
            }
        });

        document.getElementById('total-balance').textContent = `${totalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
        document.getElementById('monthly-income').textContent = `${filteredIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
        document.getElementById('monthly-expenses').textContent = `${filteredExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
        const listContainer = document.getElementById('transactions-list');
        listContainer.innerHTML = transactionsHTML || `<div class="p-4 text-center text-sm text-valoSlate py-8">Aucun flux enregistré.</div>`;
    });
}
