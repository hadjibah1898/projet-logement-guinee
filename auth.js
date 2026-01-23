document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const headerActions = document.querySelector('.header-actions');
    const token = localStorage.getItem('token');

    const renderGuestHeader = () => {
        headerActions.innerHTML = `
            <a href="connexion.html" class="login-link">Connexion</a>
            <a href="inscription.html" class="signup-btn">S'inscrire</a>
        `;
    };

    const renderLoggedInHeader = (user) => {
        let adminLinks = '';
        if (user.role === 'admin') {
            adminLinks = `
                <a href="admin.html" class="admin-link">Gérer Agents</a>
                <a href="admin-listings.html" class="admin-link">Gérer Annonces</a>
            `;
        }

        headerActions.innerHTML = `
            <a href="formulairepublication.html" class="signup-btn">Publier une annonce</a>
            ${adminLinks}
            <a href="profil.html" class="login-link">Profil</a>
            <button id="logout-btn" class="logout-btn">Déconnexion</button>
        `;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'connexion.html';
            });
        }
    };

    const verifyTokenAndRenderHeader = async () => {
        if (!token) {
            renderGuestHeader();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Token is invalid or expired
                throw new Error('Session invalide');
            }

            const result = await response.json();
            if (result.success && result.user) {
                // Token is valid, save fresh user data and render header
                localStorage.setItem('user', JSON.stringify(result.user));
                renderLoggedInHeader(result.user);
            } else {
                throw new Error('Impossible de vérifier la session');
            }
        } catch (error) {
            console.error("Erreur de validation de session:", error.message);
            // Clean up invalid data from storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            renderGuestHeader();
        }
    };

    verifyTokenAndRenderHeader();
});