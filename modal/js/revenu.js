// modal/js/revenu.js

// On attache la fonction directement à window pour la rendre accessible partout sans import complexe
window.initRevenuModal = function(categories, partners, currentRate = null) {
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

    // SÉCURITÉ GENTILLE : Gestion de la fermeture immédiate (la croix)
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.preventDefault();
            modal.classList.add('hidden');
        };
    }

    // Date du jour automatique si vide
    if (inputDate && !inputDate.value) {
        inputDate.value = new Date().toISOString().split('T')[0];
    }

    // Bascule Devise USD / CDF
    if (isCdfCheckbox && wrapperRate && inputRate && symbol) {
        isCdfCheckbox.onchange = () => {
            if (isCdfCheckbox.checked) {
                symbol.innerText = "FC";
                wrapperRate.classList.remove('hidden');
                inputRate.value = currentRate ? currentRate : 0;
            } else {
                symbol.innerText = "$";
                wrapperRate.classList.add('hidden');
                inputRate.value = "";
            }
        };
    }

    // Affichage des catégories configurées
    if (tagsContainer && inputCategory) {
        if (!categories || categories.length === 0) {
            tagsContainer.innerHTML = `<span class="text-[9px] text-slate-600 italic">Aucune catégorie</span>`;
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

    // Autocomplete Partenaires
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
    }
};
