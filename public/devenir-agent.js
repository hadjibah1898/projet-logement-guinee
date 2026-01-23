document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.port === '5500' ? 'http://localhost:3000' : '';
    const token = localStorage.getItem('token');
    if (!token) {
        // Rediriger vers la page de connexion, puis revenir ici après la connexion.
        window.location.href = `connexion.html?redirect=devenir-agent.html`;
        return;
    }

    const form = document.getElementById('become-agent-form');
    if (!form) return;

    const messageContainer = document.getElementById('message-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageContainer.textContent = '';
        messageContainer.className = '';

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Mise à jour en cours...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_URL}/users/become-agent`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                messageContainer.className = 'success-message';
                // Le message vient maintenant directement du serveur
                messageContainer.textContent = result.message + ' Vous allez être redirigé vers votre profil.';
                
                // Rediriger vers la page de profil après 2 secondes pour que l'utilisateur voie le message
                setTimeout(() => {
                    window.location.href = 'profil.html';
                }, 2000);
            } else {
                messageContainer.className = 'error-message';
                messageContainer.textContent = `Erreur : ${result.message || 'Une erreur est survenue.'}`;
                submitButton.disabled = false;
                submitButton.textContent = 'Confirmer et devenir agent';
            }
        } catch (error) {
            console.error('Erreur pour devenir agent:', error);
            messageContainer.className = 'error-message';
            messageContainer.textContent = 'Erreur de connexion au serveur.';
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmer et devenir agent';
        }
    });
});