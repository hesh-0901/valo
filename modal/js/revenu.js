import { db } from '../../js/config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initRevenuModal(uid, closeCallback) {
    const modalElement = document.getElementById('modal-revenu');
    const form = document.getElementById('form-revenu');
    const closeBtn = document.getElementById('close-modal-revenu');
    const submitBtn = document.getElementById('submit-revenu');

    // Date du jour automatique 
    document.getElementById('rev-date').value = new Date().toISOString().split('T')[0];

    // Actions fermeture
    const destroy = () => {
        modalElement.remove();
        closeCallback();
    };

    closeBtn.addEventListener('click', destroy);
    modalElement.addEventListener('click', (e) => { if (e.target === modalElement) destroy(); });

    // Soumission Firestore
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('rev-amount').value);
        const description = document.getElementById('rev-desc').value.trim();
        const date = document.getElementById('rev-date').value;

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = "TRANSMISSION...";

        try {
            await addDoc(collection(db, "transactions"), {
                uid: uid,
                amount: amount,
                description: description,
                date: date,
                type: 'income'
            });
            destroy();
        } catch (error) {
            console.error("Erreur d'écriture revenu:", error);
            alert("Erreur réseau.");
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = "Enregistrer le revenu";
        }
    });
}
