document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('main-search-form');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(searchForm);
            const params = new URLSearchParams();

            // Construire les paramètres de l'URL à partir du formulaire
            for (const [key, value] of formData.entries()) {
                if (value) { // N'ajouter que les champs qui ont une valeur
                    params.append(key, value);
                }
            }
            
            // Rediriger vers une page de résultats de recherche avec les paramètres
            window.location.href = `resultats.html?${params.toString()}`;
        });
    }
});