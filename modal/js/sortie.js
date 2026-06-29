import { db } from '../../js/config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initSortieModal(uid, closeCallback) {
    const modalElement = document.getElementById('modal-sortie');
    const form = document.getElementById('form-sortie');
    const closeBtn = document.getElementById('close-modal-sortie');
    const submitBtn = document.getElementById('submit-sortie');

    document.getElementById('sort-date').value = new Date().toISOString().split('T')[0];

    const destroy = () => {
        modalElement.remove();
        closeCallback();
    };

    closeBtn.addEventListener('click', destroy);
    modalElement.addEventListener('click', (e) => { if (e.target === modalElement) destroy(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('sort-amount').value);
        const description = document.getElementById('sort-desc').value.trim();
        const date = document.getElementById('sort-date').value;

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = "TRANSMISSION...";

        try {
            await addDoc(collection(db, "transactions"), {
                uid: uid,
                amount: amount,
                description: description,
                date: date,
                type: 'expense'
            });
            destroy();
        } catch (error) {
            console.error("Erreur d'écriture dépense:", error);
            alert("Erreur réseau.");
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = "Enregistrer la dépense";
        }
    });
}
