// modal/js/revenu.js

/**
 * Initialise l'ensemble des comportements interactifs du Modal de Revenu
 * @param {Array<string>} categories - Liste des rubriques d'entrées issues des settings
 * @param {Array<string>} partners - Liste de tes contacts récurrents
 * @param {number|null} currentRate - Le taux de change configuré pour la période actuelle (ex: 2850)
 */
export function initModalRevenuBehavior(categories, partners, currentRate = null) {
    const modal = document.getElementById('modal-revenu');
    const closeBtn = document.getElementById('close-modal-revenu');
    const isCdfCheckbox = document.getElementById('rev-is-cdf');
    const wrapperRate = document.getElementById('wrapper-rate');
    const inputRate = document.getElementById('rev-rate');
    const symbol = document.getElementById('currency-symbol');
    const inputDate = document.getElementById('rev-date');
    const inputCategory = document.getElementById('rev-category');
    const tagsContainer = document.getElementById('modal-rev-tags');
    const inputPartner = document.getElementById('rev-partner');
    const suggestionsBox = document.getElementById('modal-partner-suggestions');

    if (!modal) return;

    // 1. ACTION FERMETURE DU MODAL (BOUTON X)
    closeBtn.onclick = () => {
        modal.classList.add('hidden');
    };

    // 2. CONFIGURATION DE LA DATE DU JOUR PAR DÉFAUT
    if (inputDate && !inputDate.value) {
        inputDate.value = new Date().toISOString().split('T')[0];
    }

    // 3. GESTION DE LA BASCULE DEVISE (USD / CDF) & TAUX D'ÉCHANGE
    isCdfCheckbox.onchange = () => {
        if (isCdfCheckbox.checked) {
            symbol.innerText = "FC";
            wrapperRate.classList.remove('hidden');
            // Affectation du taux de la période, ou 0 s'il n'existe pas
            inputRate.value = currentRate ? currentRate : 0;
        } else {
            symbol.innerText = "$";
            wrapperRate.classList.add('hidden');
            inputRate.value = "";
        }
    };

    // 4. INJECTION ET SELECTION DES CATÉGORIES (RUBRIQUES)
    if (tagsContainer && inputCategory) {
        if (!categories || categories.length === 0) {
            tagsContainer.innerHTML = `<span class="text-[9px] text-slate-600 italic">Aucune catégorie disponible</span>`;
        } else {
            tagsContainer.innerHTML = categories.map(cat => `
                <button type="button" class="btn-select-cat text-[9px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-valoMint hover:border-valoMint/30 transition-all">
                    ${cat}
                </button>
            `).join('');

            tagsContainer.querySelectorAll('.btn-select-cat').forEach(btn => {
                btn.onclick = () => {
                    inputCategory.value = btn.innerText.trim();
                };
            });
        }
    }

    // 5. RECHERCHE PRÉDICTIVE DES PARTENAIRES (AUTOCOMPLETE)
    if (inputPartner && suggestionsBox) {
        inputPartner.oninput = (e) => {
            const val = e.target.value.trim().toLowerCase();
            if (!val || !partners || partners.length === 0) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            const matches = partners.filter(p => p.toLowerCase().includes(val));
            if (matches.length === 0) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            suggestionsBox.innerHTML = matches.map(p => `
                <div class="item-suggest p-2 text-[11px] text-slate-300 hover:text-valoMint hover:bg-slate-900 rounded-lg cursor-pointer transition-colors truncate font-medium">
                    ${p}
                </div>
            `).join('');
            suggestionsBox.classList.remove('hidden');

            suggestionsBox.querySelectorAll('.item-suggest').forEach(item => {
                item.onclick = () => {
                    inputPartner.value = item.innerText.trim();
                    suggestionsBox.classList.add('hidden');
                };
            });
        };

        // Fermer la liste si clic à l'extérieur
        document.addEventListener('click', (e) => {
            if (!inputPartner.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.classList.add('hidden');
            }
        });
    }
}
