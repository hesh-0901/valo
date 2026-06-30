// profil/setting.js

import { db, auth } from '../js/config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Listes statiques d'écosystème
const PRESET_IN = ["Salaire", "Cadeau", "Retrait d'investissement"];
const PRESET_OUT = ["Dîme", "Offrande", "Don", "Argent de poche", "Loyer", "Forfait appel", "Forfait internet", "Argent non retrouvé", "Investissement", "Épargne"];

let userDocRef = null;
let securityData = { q1: '', q2: '', a1: '', a2: '' };
let isIdentityVerified = false;

document.addEventListener("DOMContentLoaded", () => {
    // Écoute de l'état utilisateur
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userDocRef = doc(db, "users", user.uid);
            await loadConfigCenter(user);
        } else {
            window.location.href = "../index.html";
        }
    });

    initAccordions();
    bindActions();
});

// --- RENDER GLOBAL DES COMPOSANTS ---
async function loadConfigCenter(user) {
    try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) return;
        const data = snap.data();

        // 1. Profil & Identité
        document.getElementById('set-fullname').textContent = `${data.firstname || ''} ${data.lastname || ''}`.trim() || 'Utilisateur';
        document.getElementById('set-username').textContent = `@${data.username || 'username'}`;
        document.getElementById('set-email').textContent = user.email ? user.email.replace('@valo.local', '') : data.username;
        
        if (data.createdAt) {
            const dateObj = new Date(data.createdAt);
            document.getElementById('set-joined').textContent = dateObj.toLocaleDateString('fr-FR');
        }

        // 2. Éléments financiers (Taux)
        document.getElementById('set-rate').value = data.exchangeRate?.value || '';
        document.getElementById('set-period').value = data.exchangeRate?.period || 'daily';

        // 3. Extraction de la sécurité issue de Register
        if (data.security) {
            securityData = {
                q1: data.security.q1 || "Question 1 non configurée",
                q2: data.security.q2 || "Question 2 non configurée",
                a1: data.security.a1 || "",
                a2: data.security.a2 || ""
            };
            document.getElementById('label-q1').textContent = securityData.q1;
            document.getElementById('label-q2').textContent = securityData.q2;
        }

        // 4. Listes dynamiques
        renderPartners(data.partners || []);
        renderTags('in', data.customIn || []);
        renderTags('out', data.customOut || []);

    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- CONTRÔLE DE SÉCURITÉ DOUBLE DÉFI ---
async function processSecurityValidation() {
    const btn = document.getElementById('btn-verify-security');
    
    if (!isIdentityVerified) {
        const ans1 = document.getElementById('ans-1').value.trim().toLowerCase();
        const ans2 = document.getElementById('ans-2').value.trim().toLowerCase();

        if (!ans1 || !ans2) {
            alert("Veuillez renseigner les deux réponses.");
            return;
        }

        if (ans1 === securityData.a1 && ans2 === securityData.a2) {
            isIdentityVerified = true;
            document.getElementById('new-key-zone').classList.remove('hidden');
            btn.textContent = "Appliquer la nouvelle clé";
            btn.classList.replace('bg-valoMint', 'bg-emerald-600');
            
            document.getElementById('ans-1').disabled = true;
            document.getElementById('ans-2').disabled = true;
        } else {
            alert("🔒 Échec : Réponses erronées.");
        }
    } else {
        const newKey = document.getElementById('new-key').value.trim();
        if (newKey.length < 6) {
            alert("La clé d'accès doit faire au moins 6 caractères.");
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = "Changement...";
            await updateDoc(userDocRef, { accessKey: newKey });
            alert("✅ Clé d'accès mise à jour.");
            location.reload();
        } catch (e) {
            alert("Erreur de sauvegarde.");
            btn.disabled = false;
        }
    }
}

// --- LOGIQUE DES RUBRIQUES & PARTENAIRES ---
async function saveRateChange() {
    const value = parseFloat(document.getElementById('set-rate').value);
    const period = document.getElementById('set-period').value;
    if (value) {
        await updateDoc(userDocRef, { exchangeRate: { value, period, updated: new Date().toISOString() } });
    }
}

async function addPartner() {
    const input = document.getElementById('add-partner-input');
    const name = input.value.trim();
    if (!name) return;

    const snap = await getDoc(userDocRef);
    const partners = snap.data().partners || [];
    partners.push(name);

    await updateDoc(userDocRef, { partners });
    input.value = '';
    renderPartners(partners);
}

function renderPartners(list) {
    const container = document.getElementById('set-partners-list');
    container.innerHTML = list.map((p, i) => `
        <div class="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
            <span class="text-xs text-slate-300">${p}</span>
            <button class="text-red-400/70 hover:text-red-400 transition-colors px-1" onclick="window.removePartner(${i})">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
}

window.removePartner = async (index) => {
    const snap = await getDoc(userDocRef);
    const partners = snap.data().partners || [];
    partners.splice(index, 1);
    await updateDoc(userDocRef, { partners });
    renderPartners(partners);
};

async function addCustomTag(type) {
    const input = document.getElementById(`add-${type}-input`);
    const val = input.value.trim();
    if (!val) return;

    const snap = await getDoc(userDocRef);
    const field = type === 'in' ? 'customIn' : 'customOut';
    const list = snap.data()[field] || [];

    if (list.length >= 10) {
        alert("Maximum de 10 éléments personnalisés atteint.");
        return;
    }

    list.push(val);
    await updateDoc(userDocRef, { [field]: list });
    input.value = '';
    renderTags(type, list);
}

function renderTags(type, customList) {
    const container = document.getElementById(`${type}-tags`);
    const presets = type === 'in' ? PRESET_IN : PRESET_OUT;

    let html = presets.map(t => `
        <div class="bg-slate-900/50 border border-slate-800/40 p-2 rounded-lg flex justify-between items-center text-[9px] text-slate-500 font-medium">
            <span class="truncate">${t}</span><i class="bi bi-lock-fill text-[8px] opacity-40"></i>
        </div>
    `).join('');

    html += customList.map((t, i) => `
        <div class="bg-slate-800 border border-slate-700 p-2 rounded-lg flex justify-between items-center text-[9px] text-white font-medium">
            <span class="truncate">${t}</span>
            <button class="text-red-400 hover:text-red-500 text-xs leading-none" onclick="window.removeTag('${type}', ${i})">&times;</button>
        </div>
    `).join('');

    container.innerHTML = html;
    document.getElementById(`${type}-count`).textContent = `${customList.length}/10`;
}

window.removeTag = async (type, index) => {
    const snap = await getDoc(userDocRef);
    const field = type === 'in' ? 'customIn' : 'customOut';
    const list = snap.data()[field] || [];
    list.splice(index, 1);
    await updateDoc(userDocRef, { [field]: list });
    renderTags(type, list);
};

// --- EVENTS INTERNES ---
function initAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.parentElement;
            const isOpen = item.classList.contains('accordion-open');
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('accordion-open'));
            if (!isOpen) item.classList.add('accordion-open');
        });
    });
}

function bindActions() {
    document.getElementById('set-rate').onchange = saveRateChange;
    document.getElementById('set-period').onchange = saveRateChange;
    document.getElementById('btn-add-partner').onclick = addPartner;
    document.getElementById('btn-add-in').onclick = () => addCustomTag('in');
    document.getElementById('btn-add-out').onclick = () => addCustomTag('out');
    document.getElementById('btn-verify-security').onclick = processSecurityValidation;
    document.getElementById('btn-logout-settings').onclick = () => signOut(auth).then(() => window.location.href = "../index.html");
}
