document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'connexion.html?redirect=profil.html';
        return;
    }

    // --- Éléments du DOM ---
    const listingsContainer = document.getElementById('my-listings-container');
    const messageContainer = document.getElementById('profile-message-container');
    const favoritesContainer = document.getElementById('my-favorites-container');

    // Fonction principale pour initialiser la page de profil
    const initializeProfile = async () => {
        try {
            // 1. Récupérer les données utilisateur à jour depuis le serveur pour plus de fiabilité
            const userResponse = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!userResponse.ok) {
                // Gérer un token invalide ou expiré
                throw new Error('Session invalide ou expirée. Veuillez vous reconnecter.');
            }

            const result = await userResponse.json();
            if (!result.success) {
                 throw new Error(result.message || 'Impossible de récupérer le profil.');
            }
            
            const user = result.user;

            // 2. Mettre à jour le localStorage avec les données fraîches
            localStorage.setItem('user', JSON.stringify(user));

            // 3. Afficher les informations de l'utilisateur et lancer la récupération de ses annonces
            displayUserInfo(user);
            fetchMyListings();
            fetchMyFavorites();

        } catch (error) {
            console.error("Erreur d'initialisation du profil:", error);
            // Nettoyer les données invalides/obsolètes et rediriger vers la connexion
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = `connexion.html?message=${encodeURIComponent(error.message)}`;
        }
    };

    // --- Afficher les informations de l'utilisateur ---
    const displayUserInfo = (user) => {
        const welcomeHeader = document.getElementById('profile-welcome');
        const userInfoCard = document.getElementById('user-info-card');

        if (welcomeHeader) {
            welcomeHeader.textContent = `Bienvenue, ${user.fullname} !`;
        }

        if (userInfoCard) {
            let agentSectionHTML = '';
            let agentProfileHTML = '';
            let adminSectionHTML = '';

            // Si l'utilisateur est un administrateur, ajouter un lien vers le tableau de bord
            if (user.role === 'admin') {
                adminSectionHTML = `<a href="admin.html" class="form-btn" style="display: block; text-align: center; margin-top: 20px; background-color: #dc3545;">Accès Administration</a>`;
            }

            if (user.role === 'agent') {
                agentSectionHTML = `<p class="agent-badge">✓ Vous êtes un Agent MDA</p>`;
                // Afficher les détails du profil de l'agent
                if (user.agentProfile) {
                    agentProfileHTML = `
                        <div class="agent-profile-details">
                            <h4>Profil d'agent</h4>
                            <p><strong>Agence :</strong> ${user.agentProfile.agencyName || 'N/A'}</p>
                            <p><strong>Expérience :</strong> ${user.agentProfile.experience !== null ? user.agentProfile.experience + ' ans' : 'N/A'}</p>
                            <p><strong>Spécialisation :</strong> ${user.agentProfile.specialization || 'N/A'}</p>
                            <p><strong>Bio :</strong> ${user.agentProfile.bio || 'N/A'}</p>
                        </div>
                    `;
                }
            } else if (user.agentApplicationStatus === 'pending') {
                agentSectionHTML = `<p class="agent-badge pending">Votre demande pour devenir agent est en cours d'examen.</p>`;
            } else {
                agentSectionHTML = `<button id="become-agent-btn" class="form-btn" style="margin-top: 20px;">Devenir Agent MDA</button>`;
            }

            userInfoCard.innerHTML = `
                <p><strong>Nom :</strong> ${user.fullname}</p>
                <p><strong>Email :</strong> ${user.email}</p>
                <button id="change-password-btn" class="btn-secondary" style="width: 100%; margin-top: 10px;">Modifier le mot de passe</button>
                ${agentSectionHTML}
                ${agentProfileHTML}
                ${adminSectionHTML}
            `;
            initializeBecomeAgentButton(); // Activer le bouton après l'avoir ajouté au DOM
            initializeChangePasswordButton(); // Activer le bouton de changement de mot de passe
        }
    };

    const displayMessage = (message, isSuccess = false) => {
        if (!messageContainer) return;
        messageContainer.textContent = message;
        messageContainer.className = isSuccess ? 'success-message' : 'error-message';
        // Auto-hide the message after 5 seconds for a better UX
        setTimeout(() => {
            if (messageContainer.textContent === message) {
                messageContainer.textContent = '';
                messageContainer.className = '';
            }
        }, 5000);
    };

    const displayEmptyListingsMessage = () => {
        listingsContainer.innerHTML = `
            <div class="add-listing-section" style="margin: 0;">
                <p>Vous n'avez publié aucune annonce pour le moment.</p>
                <a href="formulairepublication.html" class="add-listing-btn">Publier ma première annonce</a>
            </div>
        `;
    };

    const fetchMyListings = async () => {
        try {
            listingsContainer.innerHTML = '<p>Chargement de vos annonces...</p>';
            const response = await fetch(`${API_URL}/properties/my-listings`, {
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
                    displayEmptyListingsMessage();
                }
            } else {
                displayMessage(`Erreur: ${result.message}`);
            }
        } catch (error) {
            console.error('Fetch listings error:', error);
            displayMessage('Erreur de connexion au serveur.');
        }
    };

    const createMyPropertyCard = (property) => {
        const card = document.createElement('div');
        card.className = 'property-card my-listing-card';

        const formattedPrice = new Intl.NumberFormat('fr-FR').format(property.prix);
        const priceSuffix = property.type === 'Vente' ? '' : '<span>/ mois</span>';
        const imageUrl = property.photos && property.photos.length > 0
            ? `${API_URL}/${property.photos[0]}`
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

    // --- Récupérer et afficher les favoris de l'utilisateur ---
    const fetchMyFavorites = async () => {
        if (!favoritesContainer) return;

        try {
            favoritesContainer.innerHTML = '<p>Chargement de vos favoris...</p>';
            const response = await fetch(`${API_URL}/users/favorites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok && result.success) {
                favoritesContainer.innerHTML = '';
                if (result.favorites.length > 0) {
                    result.favorites.forEach(property => {
                        const card = createMyPropertyCard(property);
                        // On retire les boutons d'action pour les favoris
                        const actions = card.querySelector('.my-listing-actions');
                        if (actions) actions.remove();
                        favoritesContainer.appendChild(card);
                    });
                } else {
                    favoritesContainer.innerHTML = `<p>Vous n'avez aucune annonce en favori pour le moment.</p>`;
                }
            } else {
                displayMessage(`Erreur favoris: ${result.message}`);
            }
        } catch (error) {
            console.error('Fetch favorites error:', error);
            displayMessage('Erreur de connexion au serveur pour les favoris.');
        }
    };

    // --- Logique pour devenir agent ---
    const initializeBecomeAgentButton = () => {
        const becomeAgentBtn = document.getElementById('become-agent-btn');
        if (becomeAgentBtn) {
            becomeAgentBtn.addEventListener('click', () => {
                // Rediriger vers la page du formulaire pour devenir agent
                window.location.href = 'devenir-agent.html';
            });
        }
    };

    // --- Gestion des actions sur les annonces (modifier/supprimer) ---
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
                const response = await fetch(`${API_URL}/properties/${propertyId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Supprimer la carte de l'annonce de la vue
                    target.closest('.my-listing-card').remove();
                    
                    // Si c'était la dernière annonce, afficher le message d'invitation
                    if (listingsContainer.children.length === 0) {
                        displayEmptyListingsMessage();
                    }
                    displayMessage('Annonce supprimée avec succès.', true);
                } else {
                    displayMessage(`Erreur lors de la suppression : ${result.message}`);
                }
            } catch (error) {
                console.error('Delete error:', error);
                displayMessage('Erreur de connexion au serveur lors de la suppression.');
            }
        }

        if (target.classList.contains('edit')) {
            // Rediriger vers une page de modification avec l'ID de l'annonce
            window.location.href = `modifier-annonce.html?id=${propertyId}`;
        }
    });

    // --- Logique pour la modale de changement de mot de passe ---
    const initializeChangePasswordButton = () => {
        const changePasswordBtn = document.getElementById('change-password-btn');
        const modal = document.getElementById('password-modal');
        if (!changePasswordBtn || !modal) return;

        const closeModalBtn = modal.querySelector('.modal-close');
        const passwordForm = document.getElementById('password-change-form');
        const modalMessageContainer = document.getElementById('modal-message-container');

        const openModal = () => {
            modal.classList.add('is-visible');
        };

        const closeModal = () => {
            modal.classList.remove('is-visible');
            // Réinitialiser le formulaire après la transition
            setTimeout(() => {
                passwordForm.reset();
                modalMessageContainer.innerHTML = '';
                modalMessageContainer.className = '';
            }, 300);
        };

        changePasswordBtn.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            modalMessageContainer.innerHTML = '';
            modalMessageContainer.className = '';

            const formData = new FormData(passwordForm);
            const data = Object.fromEntries(formData.entries());

            if (data.newPassword !== data.confirmNewPassword) {
                modalMessageContainer.className = 'error-message';
                modalMessageContainer.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
                return;
            }

            try {
                const response = await fetch(`${API_URL}/users/change-password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword: data.currentPassword,
                        newPassword: data.newPassword
                    })
                });

                const result = await response.json();
                modalMessageContainer.className = response.ok ? 'success-message' : 'error-message';
                modalMessageContainer.textContent = result.message;

                if (response.ok) setTimeout(closeModal, 2000);

            } catch (error) {
                modalMessageContainer.className = 'error-message';
                modalMessageContainer.textContent = 'Erreur de connexion au serveur.';
            }
        });
    };

    // Démarrer le chargement de la page
    initializeProfile();
});