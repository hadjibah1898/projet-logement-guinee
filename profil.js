document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'connexion.html?redirect=profil.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        localStorage.removeItem('token');
        window.location.href = 'connexion.html';
        return;
    }

    // --- Afficher les informations de l'utilisateur ---
    const welcomeHeader = document.getElementById('profile-welcome');
    const userInfoCard = document.getElementById('user-info-card');

    if (welcomeHeader) {
        welcomeHeader.textContent = `Bienvenue, ${user.fullname} !`;
    }
    if (userInfoCard) {
        let agentSectionHTML = '';
        // Afficher le bouton "Devenir Agent" ou un badge si l'utilisateur est déjà un agent.
        if (user.role === 'agent') {
            agentSectionHTML = `<p class="agent-badge" style="text-align: center; margin-top: 20px; color: green; font-weight: bold;">✓ Vous êtes un agent</p>`;
        } else {
            agentSectionHTML = `<button id="become-agent-btn" class="btn-primary" style="width: 100%; margin-top: 20px;">Devenir Agent MDA</button>`;
        }

        userInfoCard.innerHTML = `
            <p><strong>Nom :</strong> ${user.fullname}</p>
            <p><strong>Email :</strong> ${user.email}</p>
            <button class="btn-secondary" style="width: 100%; margin-top: 10px;">Modifier le mot de passe</button>
            ${agentSectionHTML}
        `;
    }

    // --- Récupérer et afficher les annonces de l'utilisateur ---
    const listingsContainer = document.getElementById('my-listings-container');
    if (!listingsContainer) return;

    const fetchMyListings = async () => {
        try {
            listingsContainer.innerHTML = '<p>Chargement de vos annonces...</p>';
            const response = await fetch('http://localhost:3000/api/properties/my-listings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (response.ok && result.success) {
                listingsContainer.innerHTML = '';
                if (result.properties.length > 0) {
                    result.properties.forEach(property => {
                        const card = createMyPropertyCard(property);
                        listingsContainer.appendChild(card);
                    });
                } else {
                    listingsContainer.innerHTML = `
                        <div class="add-listing-section" style="margin: 0;">
                            <p>Vous n'avez publié aucune annonce pour le moment.</p>
                            <a href="formulairepublication.html" class="add-listing-btn">Publier ma première annonce</a>
                        </div>
                    `;
                }
            } else {
                listingsContainer.innerHTML = `<p style="color: red;">Erreur: ${result.message}</p>`;
            }
        } catch (error) {
            listingsContainer.innerHTML = `<p style="color: red;">Erreur de connexion au serveur.</p>`;
        }
    };

    const createMyPropertyCard = (property) => {
        const card = document.createElement('div');
        card.className = 'property-card my-listing-card';

        const formattedPrice = new Intl.NumberFormat('fr-FR').format(property.prix);
        const priceSuffix = property.type === 'Vente' ? '' : '<span>/ mois</span>';
        const imageUrl = property.photos && property.photos.length > 0
            ? `http://localhost:3000/${property.photos[0]}`
            : 'https://via.placeholder.com/400x250/cccccc/808080?text=Image+non+disponible';


        card.innerHTML = `
            <img src="${imageUrl}" alt="Photo de ${property.titre}">
            <div class="property-details">
                <h3>${property.titre}</h3>
                <p class="property-location">${property.ville}</p>
                <p class="property-price">${formattedPrice} GNF ${priceSuffix}</p>
            </div>
            <div class="my-listing-actions">
                <a href="details-propriete.html?id=${property._id}" class="btn-action view">Voir</a>
                <button class="btn-action edit" data-id="${property._id}">Modifier</button>
                <button class="btn-action delete" data-id="${property._id}">Supprimer</button>
            </div>
        `;
        return card;
    };

    // --- Logique pour devenir agent ---
    const becomeAgentBtn = document.getElementById('become-agent-btn');
    if (becomeAgentBtn) {
        becomeAgentBtn.addEventListener('click', async () => {
            if (!confirm('Êtes-vous sûr de vouloir devenir un agent ? Cela vous donnera de nouvelles permissions.')) {
                return;
            }

            becomeAgentBtn.disabled = true;
            becomeAgentBtn.textContent = 'Mise à jour en cours...';

            try {
                const response = await fetch('http://localhost:3000/api/users/become-agent', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Mettre à jour le token et les infos utilisateur dans le localStorage
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));

                    alert(result.message);
                    window.location.reload(); // Recharger pour refléter les changements
                } else {
                    alert(`Erreur : ${result.message}`);
                    becomeAgentBtn.disabled = false;
                    becomeAgentBtn.textContent = 'Devenir Agent MDA';
                }
            } catch (error) {
                console.error('Erreur pour devenir agent:', error);
                alert('Erreur de connexion au serveur.');
                becomeAgentBtn.disabled = false;
                becomeAgentBtn.textContent = 'Devenir Agent MDA';
            }
        });
    }

    listingsContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('.btn-action');
        if (!target) return;

        const propertyId = target.dataset.id;

        if (target.classList.contains('delete')) {
            // Confirmation avant de supprimer
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.')) {
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/properties/${propertyId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Supprimer la carte de l'annonce de la vue
                    target.closest('.my-listing-card').remove();
                    
                    // Si c'était la dernière annonce, afficher le message d'invitation
                    if (listingsContainer.children.length === 0) {
                        listingsContainer.innerHTML = `
                            <div class="add-listing-section" style="margin: 0;">
                                <p>Vous n'avez publié aucune annonce pour le moment.</p>
                                <a href="formulairepublication.html" class="add-listing-btn">Publier ma première annonce</a>
                            </div>
                        `;
                    }
                } else {
                    alert(`Erreur lors de la suppression : ${result.message}`);
                }
            } catch (error) {
                alert('Erreur de connexion au serveur lors de la suppression.');
                console.error('Delete error:', error);
            }
        }

        if (target.classList.contains('edit')) {
            // Rediriger vers une page de modification avec l'ID de l'annonce
            window.location.href = `modifier-annonce.html?id=${propertyId}`;
        }
    });

    fetchMyListings();
});