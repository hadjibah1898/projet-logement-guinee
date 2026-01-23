document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // 1. Vérification de l'authentification et des droits d'admin
    if (!token) {
        window.location.href = 'connexion.html?redirect=admin.html';
        return;
    }
    if (!user || user.role !== 'admin') {
        alert('Accès refusé. Vous devez être administrateur.');
        window.location.href = 'profil.html';
        return;
    }

    const applicationsList = document.getElementById('applications-list');
    const messageContainer = document.getElementById('admin-message-container');

    const displayMessage = (message, isSuccess = false) => {
        messageContainer.textContent = message;
        messageContainer.className = isSuccess ? 'success-message' : 'error-message';
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = '';
        }, 5000);
    };

    // 2. Récupérer les demandes en attente
    const fetchApplications = async () => {
        try {
            const response = await fetch('/users/agent-applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Erreur lors de la récupération des demandes.');
            }

            const result = await response.json();
            if (result.success) {
                displayApplications(result.applications);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            applicationsList.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    };

    // 3. Afficher les demandes
    const displayApplications = (applications) => {
        applicationsList.innerHTML = '';
        if (applications.length === 0) {
            applicationsList.innerHTML = '<p>Aucune demande en attente pour le moment.</p>';
            return;
        }

        applications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'application-card';
            card.dataset.userId = app._id;

            const profile = app.agentProfile || {};
            card.innerHTML = `
                <div class="application-details">
                    <h3>${app.fullname}</h3>
                    <p><strong>Email:</strong> ${app.email}</p>
                    <p><strong>Téléphone:</strong> ${app.phone || 'Non fourni'}</p>
                    <hr>
                    <p><strong>Agence:</strong> ${profile.agencyName || 'N/A'}</p>
                    <p><strong>Expérience:</strong> ${profile.experience !== null ? profile.experience + ' ans' : 'N/A'}</p>
                    <p><strong>Spécialisation:</strong> ${profile.specialization || 'N/A'}</p>
                    <p><strong>Bio:</strong> ${profile.bio || 'N/A'}</p>
                </div>
                <div class="action-buttons">
                    <button class="btn-action approve" data-id="${app._id}">Approuver</button>
                    <button class="btn-action reject" data-id="${app._id}">Rejeter</button>
                </div>
            `;
            applicationsList.appendChild(card);
        });
    };

    // 4. Gérer les clics sur les boutons
    applicationsList.addEventListener('click', async (e) => {
        const button = e.target;
        if (!button.matches('.btn-action.approve') && !button.matches('.btn-action.reject')) return;

        const userId = button.dataset.id;
        const action = button.classList.contains('approve') ? 'approve' : 'reject';
        const url = `/users/${action}-agent/${userId}`;

        button.disabled = true;
        button.textContent = '...';

        try {
            const response = await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();

            if (response.ok && result.success) {
                displayMessage(result.message, true);
                document.querySelector(`.application-card[data-user-id="${userId}"]`).remove();
                if (applicationsList.children.length === 0) applicationsList.innerHTML = '<p>Aucune demande en attente.</p>';
            } else { throw new Error(result.message || 'Une erreur est survenue.'); }
        } catch (error) {
            displayMessage(error.message, false);
            button.disabled = false;
            button.textContent = action === 'approve' ? 'Approuver' : 'Rejeter';
        }
    });

    fetchApplications();
});