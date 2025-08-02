document.addEventListener('DOMContentLoaded', () => {
    const headerActions = document.querySelector('.header-actions');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        // L'utilisateur est connecté
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
    } else {
        // L'utilisateur n'est pas connecté
        headerActions.innerHTML = `
            <a href="connexion.html" class="login-link">Connexion</a>
            <a href="inscription.html" class="signup-btn">S'inscrire</a>
        `;
    }
});