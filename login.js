document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageContainer = document.getElementById('message-container');

    // Affiche les messages passés dans l'URL (ex: redirection depuis une page protégée)
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
        messageContainer.textContent = decodeURIComponent(message);
        messageContainer.className = 'error-message';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageContainer.textContent = '';
        messageContainer.className = '';

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Connexion en cours...';

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Stocker le token et les infos utilisateur
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Rediriger l'utilisateur vers la page de profil ou la page demandée
                const redirectUrl = params.get('redirect') || 'profil.html';
                window.location.href = redirectUrl;
            } else {
                messageContainer.textContent = result.message || 'Une erreur est survenue.';
                messageContainer.className = 'error-message';
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            messageContainer.textContent = 'Erreur de connexion au serveur.';
            messageContainer.className = 'error-message';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Se connecter';
        }
    });
});