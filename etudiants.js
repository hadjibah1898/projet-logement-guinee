document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const listingsContainer = document.getElementById('listings-container');

    const createPropertyCard = (property) => {
        const card = document.createElement('div');
        card.className = 'property-card';

        const formattedPrice = new Intl.NumberFormat('fr-FR').format(property.prix);
        const priceSuffix = property.type === 'Vente' ? '' : '<span>/ mois</span>';
        const imageUrl = property.photos && property.photos.length > 0
            ? `${API_URL}/${property.photos[0]}`
            : 'https://via.placeholder.com/400x250/cccccc/808080?text=Image+non+disponible';

        card.innerHTML = `
            <span class="property-id">Réf: ${property._id.slice(-6).toUpperCase()}</span>
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

    const fetchStudentListings = async () => {
        if (!listingsContainer) return;
        try {
            // On cible principalement les colocations pour les étudiants
            const response = await fetch(`${API_URL}/properties?type=Colocation`);
            const result = await response.json();

            listingsContainer.innerHTML = ''; // Vider le message de chargement

            if (response.ok && result.success && result.properties.length > 0) {
                result.properties.forEach(property => {
                    const card = createPropertyCard(property);
                    listingsContainer.appendChild(card);
                });
            } else {
                listingsContainer.innerHTML = '<p class="page-intro">Aucune offre de colocation disponible pour le moment. Revenez bientôt !</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des annonces pour étudiants:', error);
            listingsContainer.innerHTML = '<p class="page-intro" style="color: red;">Impossible de charger les annonces. Veuillez réessayer plus tard.</p>';
        }
    };

    fetchStudentListings();
});