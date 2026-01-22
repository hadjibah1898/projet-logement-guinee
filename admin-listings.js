document.addEventListener('DOMContentLoaded', () => {
    const listingsContainer = document.getElementById('listings-to-review');
    const messageContainer = document.getElementById('admin-message-container');
    const token = localStorage.getItem('token');

    // 1. Sécurité : Vérifier que l'utilisateur est un administrateur
    if (!token) {
        window.location.href = 'connexion.html?redirect=admin-listings.html';
        return;
    }
    // La vérification du rôle 'admin' doit se faire côté serveur, mais une redirection côté client est une bonne première barrière.
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            alert('Accès refusé. Vous devez être administrateur.');
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        window.location.href = 'connexion.html?redirect=admin-listings.html';
        return;
    }

    const displayMessage = (message, isSuccess = false) => {
        messageContainer.textContent = message;
        messageContainer.className = isSuccess ? 'success-message' : 'error-message';
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = '';
        }, 5000);
    };

    // 2. Charger les annonces en attente depuis l'API
    async function loadPendingListings() {
        try {
            const response = await fetch('/api/properties/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors du chargement des annonces.');
            }

            displayListings(result.properties);

        } catch (error) {
            console.error('Erreur:', error);
            listingsContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function displayListings(listings) {
        listingsContainer.innerHTML = '';
        if (listings.length === 0) {
            listingsContainer.innerHTML = '<p>Aucune annonce en attente de validation.</p>';
            return;
        }

        listings.forEach(listing => {
            const card = document.createElement('div');
            card.className = 'application-card';
            card.dataset.listingId = listing._id;
            card.innerHTML = `
                <div class="application-details">
                    <h3>${listing.titre}</h3>
                    <p><strong>Type:</strong> ${listing.type} | <strong>Prix:</strong> ${new Intl.NumberFormat('fr-FR').format(listing.prix)} GNF</p>
                    <p><strong>Lieu:</strong> ${listing.ville}, ${listing.adresse}</p>
                    <p><strong>Soumis par:</strong> ${listing.auteur ? listing.auteur.fullname : 'Utilisateur supprimé'} (${listing.auteur ? listing.auteur.email : 'N/A'})</p>
                    <hr>
                    <p>${(listing.description || '').substring(0, 150)}...</p>
                </div>
                <div class="action-buttons">
                    <button class="btn-action approve" data-id="${listing._id}">Approuver</button>
                    <button class="btn-action reject" data-id="${listing._id}">Rejeter</button>
                    <a href="details-propriete.html?id=${listing._id}" target="_blank" class="btn-action view" style="margin-top: 10px; text-align: center;">Voir l'annonce</a>
                </div>
            `;
            listingsContainer.appendChild(card);
        });
    }

    // 3. Gérer les clics sur les boutons
    listingsContainer.addEventListener('click', async (e) => {
        const button = e.target;
        if (!button.matches('.btn-action.approve') && !button.matches('.btn-action.reject')) return;

        const listingId = button.dataset.id;
        const action = button.classList.contains('approve') ? 'approve' : 'reject';
        const url = `/api/properties/${listingId}/status`;

        button.disabled = true;
        button.textContent = '...';

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action === 'approve' ? 'approuvée' : 'rejetée' })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                displayMessage(result.message, true);
                document.querySelector(`.application-card[data-listing-id="${listingId}"]`).remove();
                if (listingsContainer.children.length === 0) listingsContainer.innerHTML = '<p>Aucune annonce en attente de validation.</p>';
            } else { throw new Error(result.message || 'Une erreur est survenue.'); }
        } catch (error) {
            displayMessage(error.message, false);
            button.disabled = false;
            button.textContent = action === 'approve' ? 'Approuver' : 'Rejeter';
        }
    });

    loadPendingListings();
});