document.addEventListener('DOMContentLoaded', () => {
    // --- Contact Form ---
    const form = document.getElementById('contact-form');
    const messageContainer = document.getElementById('message-container');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageContainer.textContent = '';
        // Utiliser des classes pour styliser les messages pour plus de cohérence
        messageContainer.className = '';

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                messageContainer.className = 'success-message';
                messageContainer.textContent = result.message;
                form.reset();
            } else {
                messageContainer.className = 'error-message';
                messageContainer.textContent = result.message || 'Une erreur est survenue.';
            }
        } catch (error) {
            messageContainer.className = 'error-message';
            messageContainer.textContent = 'Erreur de connexion au serveur.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Envoyer le message';
        }
    });
});