import { db, auth } from '../js/config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Listes prédéfinies immuables (comme spécifié pour ton écosystème)
const PREDEFINED_INCOMES = ["Salaire", "Cadeau", "Retrait d'investissement"];
const PREDEFINED_EXPENSES = [
    "Dîme", "Offrande", "Don", "Argent de poche", "Loyer", 
    "Forfait appel", "Forfait internet", "Argent non retrouvé", 
    "Investissement", "Épargne"
];

let currentUserDocRef = null;
let userSecretData = { answer: '', question: '' };

document.addEventListener("DOMContentLoaded", () => {
    // Écouteur d'authentification
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Dans ton architecture, l'UID ou le username sert d'identifiant de document
            currentUserDocRef = doc(db, "users", user.uid);
            await loadUserData();
        } else {
            // Redirection si session expirée ou inexistante
            window.location.href = "../index.html";
        }
    });

    // Liaison des événements d'ajouts
    document.getElementById('btn-add-partner')?.addEventListener('click', addPartner);
    document.getElementById('btn-add-income')?.addEventListener('click', () => addTag('income'));
    document.getElementById('btn-add-expense')?.addEventListener('click', () => addTag('expense'));
    document.getElementById('btn-save-security')?.addEventListener('click', updateSecurityKey);
    document.getElementById('rate-value')?.addEventListener('change', saveExchangeRate);
    document.getElementById('rate-period')?.addEventListener('change', saveExchangeRate);
});

// 1. CHARGEMENT DES DONNÉES DEPUIS FIRESTORE
async function loadUserData() {
    try {
        const userSnap = await getDoc(currentUserDocRef);
        if (!userSnap.exists()) return;

        const data = userSnap.data();

        // Profil global
        document.getElementById('profile-full-name').textContent = data.fullName || 'Utilisateur VALO';
        document.getElementById('profile-username').textContent = `@${data.username || 'username'}`;
        if (data.avatarUrl) {
            document.getElementById('setting-avatar').src = data.avatarUrl;
        }

        // Taux de change
        if (data.exchangeRate) {
            document.getElementById('rate-value').value = data.exchangeRate.value || '';
            document.getElementById('rate-period').value = data.exchangeRate.period || 'daily';
        }

        // Récupération de la question secrète posée dans Register
        if (data.security) {
            userSecretData.question = data.security.question || "Question de récupération";
            userSecretData.answer = data.security.answer || ""; // Sauvegardée en mémoire locale pour vérification
            document.getElementById('lbl-question-1').textContent = userSecretData.question;
        }

        // Rendu des listes dynamiques
        renderPartners(data.partners || []);
        renderTags('income', data.customIncomes || []);
        renderTags('expense', data.customExpenses || []);

    } catch (error) {
        console.error("Erreur de chargement des paramètres:", error);
    }
}

// 2. GESTION DU TAUX DE CHANGE
async function saveExchangeRate() {
    const value = parseFloat(document.getElementById('rate-value').value);
    const period = document.getElementById('rate-period').value;

    if (!value) return;

    await updateDoc(currentUserDocRef, {
        exchangeRate: { value, period, updatedAt: new Date().toISOString() }
    });
}

// 3. SECTORISATION DES PARTENAIRES FINANCIERS
function renderPartners(partners) {
    const container = document.getElementById('partners-list');
    container.innerHTML = '';

    partners.forEach((partner, index) => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-slate-800/40";
        div.innerHTML = `
            <span class="text-xs font-medium text-slate-200">${partner}</span>
            <button class="text-red-400 text-xs p-1 hover:text-red-500 transition-colors" data-index="${index}">
                <i class="bi bi-trash"></i>
            </button>
        `;
        div.querySelector('button').addEventListener('click', () => deletePartner(index, partners));
        container.appendChild(div);
    });
}

async function addPartner() {
    const input = document.getElementById('new-partner-name');
    const name = input.value.trim();
    if (!name) return;

    const userSnap = await getDoc(currentUserDocRef);
    const currentPartners = userSnap.data().partners || [];

    currentPartners.push(name);
    await updateDoc(currentUserDocRef, { partners: currentPartners });
    input.value = '';
    renderPartners(currentPartners);
}

async function deletePartner(index, currentPartners) {
    currentPartners.splice(index, 1);
    await updateDoc(currentUserDocRef, { partners: currentPartners });
    renderPartners(currentPartners);
}

// 4. GESTION DES RUBRIQUES ENTRÉES / SORTIES (MAX 10)
function renderTags(type, customTags) {
    const container = document.getElementById(`${type}-tags-container`);
    const countLabel = document.getElementById(`${type}-count`);
    const predefinedList = type === 'income' ? PREDEFINED_INCOMES : PREDEFINED_EXPENSES;

    container.innerHTML = '';

    // Affichage des verrous prédéfinis
    predefinedList.forEach(tag => {
        container.appendChild(createTagElement(tag, true));
    });

    // Affichage des personnalisés éditables
    customTags.forEach((tag, index) => {
        container.appendChild(createTagElement(tag, false, () => deleteTag(type, index, customTags)));
    });

    // Total cumulé sur la limite max de 10 personnalisés
    countLabel.textContent = `${customTags.length}/10`;
}

function createTagElement(text, isPredefined, onDeleteClick = null) {
    const div = document.createElement('div');
    div.className = "bg-slate-800 border border-slate-700/40 p-1.5 rounded-lg text-slate-300 flex justify-between items-center text-[10px]";
    
    if (isPredefined) {
        div.innerHTML = `<span class="truncate pr-1">${text}</span><i class="bi bi-lock-fill text-[8px] text-valoSlate shrink-0"></i>`;
    } else {
        div.innerHTML = `
            <span class="truncate pr-1 text-white">${text}</span>
            <button type="button" class="text-red-400 hover:text-red-500 text-[9px] shrink-0"><i class="bi bi-x-circle-fill"></i></button>
        `;
        div.querySelector('button').addEventListener('click', onDeleteClick);
    }
    return div;
}

async function addTag(type) {
    const input = document.getElementById(`new-${type}-tag`);
    const newTag = input.value.trim();
    if (!newTag) return;

    const userSnap = await getDoc(currentUserDocRef);
    const fieldName = type === 'income' ? 'customIncomes' : 'customExpenses';
    const currentTags = userSnap.data()[fieldName] || [];

    // Blocage strict à 10 éléments personnalisés
    if (currentTags.length >= 10) {
        alert("Limite maximale de 10 rubriques personnalisées atteinte.");
        return;
    }

    currentTags.push(newTag);
    await updateDoc(currentUserDocRef, { [fieldName]: currentTags });
    input.value = '';
    renderTags(type, currentTags);
}

async function deleteTag(type, index, currentTags) {
    const fieldName = type === 'income' ? 'customIncomes' : 'customExpenses';
    currentTags.splice(index, 1);
    await updateDoc(currentUserDocRef, { [fieldName]: currentTags });
    renderTags(type, currentTags);
}

// 5. DOUBLE VERROU ET CONDITIONNEMENT PAR QUESTIONS SECRÈTES
async function updateSecurityKey() {
    const answerInput = document.getElementById('sec-answer-1').value.trim();
    const newKeyInput = document.getElementById('new-access-key').value.trim();
    const btn = document.getElementById('btn-save-security');

    if (!answerInput || !newKeyInput) {
        alert("Veuillez remplir la réponse et le nouveau code.");
        return;
    }

    // Vérification de la réponse (Comparaison insensible à la casse)
    if (answerInput.toLowerCase() !== userSecretData.answer.toLowerCase()) {
        alert("Réponse de sécurité incorrecte. Modification de l'index refusée.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "MISE À JOUR...";

    try {
        // Mise à jour de l'accessKey ou du mot de passe dans ton modèle Firestore
        await updateDoc(currentUserDocRef, {
            accessKey: newKeyInput 
        });
        
        alert("Code Secret actualisé avec succès !");
        document.getElementById('sec-answer-1').value = '';
        document.getElementById('new-access-key').value = '';
    } catch (error) {
        console.error("Erreur de mise à jour de clé :", error);
    } finally {
        btn.disabled = false;
        btn.textContent = "Mettre à jour la clé";
    }
}
