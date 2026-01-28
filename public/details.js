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
                <button type="button" class="slider-arrow next-slide" aria-label="Image suivante">&#10095;</button>
                <div class="slide-counter">1 / ${property.photos && property.photos.length > 0 ? property.photos.length : 1}</div>
            </section>

            <div class="details-content">
                <div class="property-main-info">
                    <h1>${property.titre}</h1>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${property.ville}, ${property.adresse}</p>
                    <p class="price">${formattedPrice} GNF ${priceSuffix}</p>
                    
                    <h2 class="section-title-details">Caractéristiques</h2>
                    <ul class="features-list">
                        <li>Type: ${property.type}</li>
                        <li>Surface: ${property.surface} m²</li>
                    </ul>

                    <h2 class="section-title-details">Description</h2>
                    <div class="description">
                        <p>${property.description.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>

                <aside class="contact-agent-card">
                    <h3>Contacter l'annonceur</h3>
                    <p><strong>Nom:</strong> ${authorName}</p>
                    <p><strong>Email:</strong> ${authorEmail}</p>
                    <p><strong>Téléphone:</strong> ${property.tel || 'Non spécifié'}</p>
                    <hr>
                    <a href="mailto:${property.auteur ? property.auteur.email : ''}?subject=Intéressé par: ${property.titre}" class="cta-button" style="display:block; text-align:center; margin-bottom:10px;">Envoyer un email</a>
                    <a href="tel:${property.tel}" class="cta-button-green" style="display:block; text-align:center;">Appeler</a>
                </aside>
            </div>
        `;

        // --- Logique du Slider ---
        const slides = document.querySelectorAll('.gallery-slide');
        const prevBtn = document.querySelector('.prev-slide');
        const nextBtn = document.querySelector('.next-slide');
        const counter = document.querySelector('.slide-counter');
        let currentSlide = 0;

        const updateSlider = () => {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });
            if (counter) {
                counter.textContent = `${currentSlide + 1} / ${slides.length}`;
            }
        };

        if (prevBtn && nextBtn && slides.length > 1) {
            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                updateSlider();
            });

            nextBtn.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % slides.length;
                updateSlider();
            });
        } else {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        }
    };

    fetchPropertyDetails();
});