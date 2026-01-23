document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.port === '5500' ? 'http://localhost:3000' : '';
    const listingsContainer = document.getElementById('listings-container');

    if (!listingsContainer) {
        return;
    }

    // Récupérer tous les paramètres de recherche de l'URL
    const params = new URLSearchParams(window.location.search);
    
    // Pour la compatibilité avec les pages comme a-vendre.html,
    // on ajoute le type de propriété s'il est défini dans le body.
    const propertyType = document.body.dataset.propertyType;
    if (propertyType && !params.has('type')) {
        params.set('type', propertyType);
    }

    const fetchAndDisplayListings = async () => {
        try {
            listingsContainer.innerHTML = '<p style="text-align: center;">Chargement des annonces...</p>';

            // Utiliser tous les paramètres pour la requête fetch
            const response = await fetch(`${API_URL}/properties?${params.toString()}`);
            const result = await response.json();

            if (response.ok && result.success) {
                listingsContainer.innerHTML = ''; // Vider le conteneur
                if (result.properties.length > 0) {
                    const resultsIntro = document.getElementById('results-intro');
                    if (resultsIntro) {
                        resultsIntro.textContent = `${result.properties.length} annonce(s) trouvée(s) pour vos critères.`;
                    }
                    result.properties.forEach(property => {
                        const card = createPropertyCard(property);
                        listingsContainer.appendChild(card);
                    });
                } else {
                    listingsContainer.innerHTML = '<p style="text-align: center;">Aucune annonce trouvée pour les critères sélectionnés.</p>';
                }
            } else {
                listingsContainer.innerHTML = `<p style="text-align: center; color: red;">Erreur lors du chargement : ${result.message || 'Erreur inconnue'}</p>`;
            }
        } catch (error) {
            console.error('Erreur:', error);
            listingsContainer.innerHTML = '<p style="text-align: center; color: red;">Impossible de se connecter au serveur pour charger les annonces.</p>';
        }
    };

    const createPropertyCard = (property) => {
        const card = document.createElement('div');
        card.className = 'property-card';

        const formattedPrice = new Intl.NumberFormat('fr-FR').format(property.prix);
        const priceSuffix = property.type === 'Vente' ? '' : '<span>/ mois</span>';
        const imageUrl = property.photos && property.photos.length > 0
            ? `${API_URL}/${property.photos[0]}`
            : 'https://via.placeholder.com/400x250/cccccc/808080?text=Image+non+disponible';

        card.innerHTML = `
            <img src="${imageUrl}" alt="Photo de ${property.titre}">
            <div class="property-details">
                <h3>${property.titre}</h3>
                <p class="property-location">${property.ville}, ${property.adresse}</p>
                <p class="property-price">${formattedPrice} GNF ${priceSuffix}</p>
            </div>
            <a href="details-propriete.html?id=${property._id}" class="details-btn">Voir les détails</a>
        `;
        return card;
    };

    fetchAndDisplayListings();
});