import { db, auth } from '../js/config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const PRESET_IN = ["Salaire", "Cadeau", "Retrait d'investissement"];
const PRESET_OUT = ["Dîme", "Offrande", "Don", "Argent de poche", "Loyer", "Forfait appel", "Forfait internet", "Argent non retrouvé", "Investissement", "Épargne"];

let userDocRef = null;
let securityData = { q1: '', q2: '', a1: '', a2: '' };
let isVerified = false;

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userDocRef = doc(db, "users", user.uid);
            loadAllData();
        } else {
            window.location.href = "../index.html";
        }
    });
    

    setupAccordions();
    setupEventListeners();
});

async function loadAllData() {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return;
    const data = snap.data();

    // 1. Profil
    document.getElementById('set-fullname').textContent = data.fullName;
    document.getElementById('set-username').textContent = `@${data.username}`;
    document.getElementById('set-email').textContent = data.email;
    document.getElementById('set-avatar').src = data.avatarUrl || '../valo.png';
    
    const joinedDate = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
    document.getElementById('set-joined').textContent = joinedDate.toLocaleDateString();

    // 2. Taux
    document.getElementById('set-rate').value = data.exchangeRate?.value || 2850;
    document.getElementById('set-period').value = data.exchangeRate?.period || 'daily';

    // 3. Sécurité (Questions de Register)
    if (data.security) {
        securityData = {
            q1: data.security.q1,
            q2: data.security.q2,
            a1: data.security.a1,
            a2: data.security.a2
        };
        document.getElementById('label-q1').textContent = securityData.q1;
        document.getElementById('label-q2').textContent = securityData.q2;
    }

    // 4. Listes
    renderPartners(data.partners || []);
    renderTags('in', data.customIn || []);
    renderTags('out', data.customOut || []);
}

function setupAccordions() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.parentElement;
            const wasOpen = item.classList.contains('accordion-open');
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('accordion-open'));
            if (!wasOpen) item.classList.add('accordion-open');
        });
    });
}

function setupEventListeners() {
    // Taux
    document.getElementById('set-rate').onchange = saveRate;
    document.getElementById('set-period').onchange = saveRate;

    // Logout
    document.getElementById('btn-logout-settings').onclick = () => signOut(auth).then(() => window.location.href = "../index.html");

    // Partners
    document.getElementById('btn-add-partner').onclick = addPartner;

    // Tags
    document.getElementById('btn-add-in').onclick = () => addTag('in');
    document.getElementById('btn-add-out').onclick = () => addTag('out');

    // Vérification Sécurité
    document.getElementById('btn-verify-security').onclick = handleSecurityProcess;
}

// --- LOGIQUE SÉCURITÉ ---
async function handleSecurityProcess() {
    const btn = document.getElementById('btn-verify-security');
    
    if (!isVerified) {
        // Étape de vérification
        const ans1 = document.getElementById('ans-1').value.trim().toLowerCase();
        const ans2 = document.getElementById('ans-2').value.trim().toLowerCase();

        if (ans1 === securityData.a1.toLowerCase() && ans2 === securityData.a2.toLowerCase()) {
            isVerified = true;
            document.getElementById('new-key-zone').classList.remove('hidden');
            btn.textContent = "Mettre à jour le Code Secret";
            btn.classList.replace('bg-valoMint', 'bg-emerald-500');
            // Désactiver les inputs de réponses
            document.getElementById('ans-1').disabled = true;
            document.getElementById('ans-2').disabled = true;
        } else {
            alert("🔒 Les réponses ne correspondent pas à votre identité.");
        }
    } else {
        // Étape de mise à jour
        const newKey = document.getElementById('new-key').value.trim();
        if (newKey.length < 4) return alert("Le code doit avoir au moins 4 caractères.");

        await updateDoc(userDocRef, { accessKey: newKey });
        alert("✅ Code Secret actualisé !");
        location.reload();
    }
}

// --- LOGIQUE LISTES & TAGS ---
async function saveRate() {
    const value = document.getElementById('set-rate').value;
    const period = document.getElementById('set-period').value;
    await updateDoc(userDocRef, { exchangeRate: { value, period } });
}

async function addPartner() {
    const name = document.getElementById('add-partner-input').value.trim();
    if (!name) return;
    const snap = await getDoc(userDocRef);
    const list = snap.data().partners || [];
    list.push(name);
    await updateDoc(userDocRef, { partners: list });
    document.getElementById('add-partner-input').value = '';
    renderPartners(list);
}

function renderPartners(list) {
    const container = document.getElementById('set-partners-list');
    container.innerHTML = list.map((p, i) => `
        <div class="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span class="text-[11px]">${p}</span>
            <button onclick="window.delPartner(${i})" class="text-red-400 p-1"><i class="bi bi-trash"></i></button>
        </div>
    `).join('');
}

window.delPartner = async (index) => {
    const snap = await getDoc(userDocRef);
    const list = snap.data().partners || [];
    list.splice(index, 1);
    await updateDoc(userDocRef, { partners: list });
    renderPartners(list);
};

// Logique Tags Similaire...
async function addTag(type) {
    const input = document.getElementById(`add-${type}-input`);
    const val = input.value.trim();
    if (!val) return;
    const snap = await getDoc(userDocRef);
    const list = snap.data()[`custom${type === 'in' ? 'In' : 'Out'}`] || [];
    if (list.length >= 10) return alert("Maximum atteint.");
    list.push(val);
    await updateDoc(userDocRef, { [`custom${type === 'in' ? 'In' : 'Out'}`]: list });
    input.value = '';
    renderTags(type, list);
}

function renderTags(type, list) {
    const container = document.getElementById(`${type}-tags`);
    const presets = type === 'in' ? PRESET_IN : PRESET_OUT;
    
    let html = presets.map(t => `
        <div class="bg-slate-900 border border-slate-800 p-2 rounded-lg flex justify-between items-center text-[9px] text-slate-400">
            <span>${t}</span><i class="bi bi-lock-fill"></i>
        </div>
    `).join('');

    html += list.map((t, i) => `
        <div class="bg-slate-800 border border-valoMint/20 p-2 rounded-lg flex justify-between items-center text-[9px] text-white">
            <span>${t}</span>
            <button onclick="window.delTag('${type}', ${i})" class="text-red-400"><i class="bi bi-x"></i></button>
        </div>
    `).join('');

    container.innerHTML = html;
    document.getElementById(`${type}-count`).textContent = `${list.length}/10`;
}

window.delTag = async (type, index) => {
    const snap = await getDoc(userDocRef);
    const field = `custom${type === 'in' ? 'In' : 'Out'}`;
    const list = snap.data()[field] || [];
    list.splice(index, 1);
    await updateDoc(userDocRef, { [field]: list });
    renderTags(type, list);
};
