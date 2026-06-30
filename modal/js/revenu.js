// modal/js/revenu.js

/**
 * Génère les tags de rubriques d'entrées dans le modal et les rend cliquables
 * @param {Array<string>} listCategories - Tableau des rubriques (ex: ['Vente', 'UI/UX Design'])
 */
export function initialiserTagsRevenu(listCategories) {
    const container = document.getElementById('modal-rev-tags');
    const inputDesc = document.getElementById('rev-desc');
    if (!container || !inputDesc) return;

    if (!listCategories || listCategories.length === 0) {
        container.innerHTML = `<span class="text-[9px] text-slate-600 italic">Aucune rubrique</span>`;
        return;
    }

    // Injection des boutons de rubriques
    container.innerHTML = listCategories.map(cat => `
        <button type="button" class="tag-revenu-btn text-[9px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-valoMint hover:border-valoMint/30 transition-all">
            ${cat}
        </button>
    `).join('');

    // Rendre chaque bouton fonctionnel au clic
    container.querySelectorAll('.tag-revenu-btn').forEach(button => {
        button.onclick = () => {
            inputDesc.value = button.innerText.trim();
        };
    });
}

/**
 * Active la recherche prédictive (autocomplete) des partenaires récurrents
 * @param {Array<string>} listPartners - Tableau des contacts (ex: ['Samuel Kalenga', 'Vianelle'])
 */
export function initialiserRecherchePartenaire(listPartners) {
    const inputPartner = document.getElementById('rev-partner');
    const boxSuggestions = document.getElementById('modal-partner-suggestions');
    if (!inputPartner || !boxSuggestions) return;

    inputPartner.addEventListener('input', (e) => {
        const saisie = e.target.value.trim().toLowerCase();
        
        if (!saisie || !listPartners || listPartners.length === 0) {
            boxSuggestions.classList.add('hidden');
            return;
        }

        // Filtrer la liste globale selon la saisie de l'utilisateur
        const correspondances = listPartners.filter(p => p.toLowerCase().includes(saisie));

        if (correspondances.length === 0) {
            boxSuggestions.classList.add('hidden');
            return;
        }

        // Injecter le résultat du filtre
        boxSuggestions.innerHTML = correspondances.map(p => `
            <div class="item-suggest-rev p-2 text-[11px] text-slate-300 hover:text-valoMint hover:bg-slate-900 rounded-lg cursor-pointer transition-colors font-medium truncate">
                ${p}
            </div>
        `).join('');

        boxSuggestions.classList.remove('hidden');

        // Appliquer la suggestion cliquée au champ texte
        boxSuggestions.querySelectorAll('.item-suggest-rev').forEach(div => {
            div.onclick = () => {
                inputPartner.value = div.innerText.trim();
                boxSuggestions.classList.add('hidden');
            };
        });
    });

    // Fermer le volet si l'utilisateur clique en dehors de la zone
    document.addEventListener('click', (e) => {
        if (!inputPartner.contains(e.target) && !boxSuggestions.contains(e.target)) {
            boxSuggestions.classList.add('hidden');
        }
    });
}
