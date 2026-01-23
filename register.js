document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const form = document.getElementById('register-form');
    if (!form) return; // Ne rien faire si le formulaire n'est pas sur la page

    const messageContainer = document.getElementById('message-container');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');

    // Fonction pour effacer les messages d'erreur dès que l'utilisateur tape
    const clearMessages = () => {
        if (messageContainer.textContent) {
            messageContainer.textContent = '';
        }
    };
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', clearMessages);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // --- Validation côté client améliorée ---
        if (password.length < 8) {
            messageContainer.style.color = 'red';
            messageContainer.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
            return;
        }
        if (password !== confirmPassword) {
            messageContainer.style.color = 'red';
            messageContainer.textContent = 'Les mots de passe ne correspondent pas.';
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Inscription en cours...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        delete data.confirm_password; // Bonne pratique : ne pas envoyer le mot de passe de confirmation

        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Rediriger vers la page de connexion avec un message de succès clair
                window.location.href = `connexion.html?message=${encodeURIComponent('Inscription réussie ! Vous pouvez maintenant vous connecter.')}`;
            } else {
                messageContainer.style.color = 'red';
                messageContainer.textContent = result.message || 'Une erreur est survenue lors de l\'inscription.';
            }
        } catch (error) {
            messageContainer.style.color = 'red';
            messageContainer.textContent = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
            console.error('Registration error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'S\'inscrire';
        }
    });
});