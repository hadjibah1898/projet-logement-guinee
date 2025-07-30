document.addEventListener('DOMContentLoaded', () => {
    const headerActions = document.querySelector('.header-actions');
    const token = localStorage.getItem('token');

    if (token) {
        // L'utilisateur est connecté
        headerActions.innerHTML = `
            <a href="formulairepublication.html" class="header-btn primary">Publier une annonce</a>
            <a href="profil.html" class="header-btn">Profil</a>
            <button id="logout-btn" class="header-btn">Déconnexion</button>
        `;

        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user'); // Bonne pratique : supprimer aussi les infos utilisateur
            window.location.href = 'connexion.html'; // Rediriger vers la page de connexion
        });
    } else {
        // L'utilisateur n'est pas connecté
        headerActions.innerHTML = `
            <a href="connexion.html" class="header-btn">Connexion</a>
            <a href="inscription.html" class="header-btn primary">Inscription</a>
        `;
    }
});