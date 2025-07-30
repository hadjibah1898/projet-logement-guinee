document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    // Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion.
    // On ajoute un paramètre pour le rediriger ici après la connexion.
    if (!token) {
        window.location.href = 'connexion.html?redirect=formulairepublication.html';
        return;
    }

    const form = document.getElementById('publication-form');
    if (!form) return;

    const messageContainer = document.getElementById('message-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageContainer.textContent = '';
        messageContainer.className = ''; // Réinitialiser les classes CSS

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Publication en cours...';

        // Pour envoyer des fichiers, il est crucial d'utiliser FormData directement.
        const formData = new FormData(form);

        try {
            const response = await fetch('http://localhost:3000/api/properties/submit-annonce', {
                method: 'POST',
                headers: {
                    // Ne PAS définir 'Content-Type'. Le navigateur le fera pour vous.
                    'Authorization': `Bearer ${token}`
                },
                body: formData // Envoyer l'objet FormData directement
            });

            const result = await response.json();

            if (response.ok && result.success) {
                messageContainer.textContent = 'Annonce publiée avec succès ! Vous allez être redirigé.';
                messageContainer.classList.add('success-message');
                form.reset();
                setTimeout(() => window.location.href = 'profil.html', 2000);
            } else {
                messageContainer.textContent = result.message || 'Une erreur est survenue.';
                messageContainer.classList.add('error-message');
            }
        } catch (error) {
            messageContainer.textContent = 'Erreur de connexion au serveur. Veuillez réessayer.';
            messageContainer.classList.add('error-message');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Publier l'annonce";
        }
    });
});