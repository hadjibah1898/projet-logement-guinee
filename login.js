document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (!form) return; // Ne rien faire si le formulaire n'est pas sur la page

    const messageContainer = document.getElementById('message-container');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Fonction pour effacer le message d'erreur dès que l'utilisateur tape
    const clearMessageOnInput = () => {
        if (messageContainer.textContent) {
            messageContainer.textContent = '';
        }
    };
    emailInput.addEventListener('input', clearMessageOnInput);
    passwordInput.addEventListener('input', clearMessageOnInput);

    // Afficher le message de redirection (ex: après une inscription réussie)
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
        messageContainer.style.color = 'green'; // Message de succès en vert
        messageContainer.textContent = decodeURIComponent(message);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageContainer.textContent = ''; // Effacer les anciens messages

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Connexion en cours...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok && result.success) {
                // Stocker le token et les informations utilisateur
                localStorage.setItem('token', result.token);
                const payload = JSON.parse(atob(result.token.split('.')[1]));
                localStorage.setItem('user', JSON.stringify(payload.user));
                
                // Vérifier s'il y a une URL de redirection dans les paramètres de la page
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect');

                // Rediriger vers la page de redirection si elle existe, sinon vers la page d'accueil par défaut
                window.location.href = redirectUrl || 'index.html';
            } else {
                messageContainer.style.color = 'red';
                messageContainer.textContent = result.message || 'Une erreur est survenue.';
            }
        } catch (error) {
            messageContainer.style.color = 'red';
            messageContainer.textContent = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.';
            console.error('Login error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Se connecter';
        }
    });
});