document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.port === '5500' ? 'http://localhost:3000' : '';
    const detailsContainer = document.getElementById('details-container');
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('id');

    const displayError = (message) => {
        detailsContainer.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h1 class="page-title">Erreur</h1>
                <p class="page-intro">${message}</p>
                <a href="index.html" class="details-btn" style="display: inline-block; text-decoration: none;">Retour à l'accueil</a>
            </div>
        `;
    };

    if (!propertyId) {
        displayError('Aucun identifiant de propriété fourni.');
        return;
    }

    const fetchPropertyDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/properties/${propertyId}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Propriété non trouvée.');
            }
            
            document.title = `${result.property.titre} - Projet Logement`;
            displayPropertyDetails(result.property);

        } catch (error) {
            console.error('Erreur:', error);
            displayError('L\'annonce que vous cherchez n\'existe pas ou a été déplacée.');
        }
    };

    const displayPropertyDetails = (property) => {
        const formattedPrice = new Intl.NumberFormat('fr-FR').format(property.prix);
        const priceSuffix = property.type === 'Vente' ? '' : '<span>/ mois</span>';
        const imageBaseUrl = API_URL + '/';

        let slidesHTML = '';
        if (property.photos && property.photos.length > 0) {
            property.photos.forEach((photo, index) => {
                slidesHTML += `
                    <div class="gallery-slide ${index === 0 ? 'active' : ''}">
                        <img src="${imageBaseUrl}${photo}" alt="Photo ${index + 1} de ${property.titre}">
                    </div>
                `;
            });
        } else {
            slidesHTML = `
                <div class="gallery-slide active">
                    <img src="https://via.placeholder.com/800x550/cccccc/808080?text=Image+non+disponible" alt="Image non disponible">
                </div>
            `;
        }
        
        const authorName = property.auteur ? property.auteur.fullname : 'Non spécifié';
        const authorEmail = property.auteur ? `<a href="mailto:${property.auteur.email}">${property.auteur.email}</a>` : 'Non spécifié';

        detailsContainer.innerHTML = `
            <section class="main-gallery-slider">
                ${slidesHTML}
                <button type="button" class="slider-arrow prev-slide" aria-label="Image précédente">&#10094;</button>
                <button type="button" class="slider-arrow next