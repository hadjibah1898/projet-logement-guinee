document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeButton = document.getElementById('close-chatbot');
    const form = document.getElementById('chatbot-input-form');
    const inputField = document.getElementById('chatbot-input-field');
    const messagesContainer = document.getElementById('chatbot-messages');
 
    if (!chatbotToggle || !chatbotWindow || !closeButton || !form || !inputField || !messagesContainer) {
        console.error("Un ou plusieurs éléments HTML du chatbot sont manquants. Vérifiez les IDs dans vos fichiers HTML.");
        return;
    }
 
    // --- Gestion de l'ouverture/fermeture ---
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.remove('hidden');
        chatbotToggle.setAttribute('aria-expanded', 'true');
        showWelcomeMessage();
        inputField.focus();
    });
 
    closeButton.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
        chatbotToggle.setAttribute('aria-expanded', 'false');
    });
 
    // --- Gestion de la conversation ---
 
    const handleUserMessage = (userMessage) => {
        if (userMessage.trim() === '') return;
 
        addMessage({ text: userMessage }, 'user-message');
        inputField.value = '';
 
        const typingIndicator = addTypingIndicator();
 
        setTimeout(() => {
            if (typingIndicator.parentNode) {
                messagesContainer.removeChild(typingIndicator);
            }
 
            const botResponse = getBotResponse(userMessage);
            addMessage(botResponse, 'bot-message');
        }, 1200);
    };
 
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleUserMessage(inputField.value);
    });
 
    /**
     * Affiche le message de bienvenue avec des suggestions.
     */
    function showWelcomeMessage() {
        messagesContainer.innerHTML = '';
        const welcomeResponse = {
            text: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
            quickReplies: [
                { text: "Je cherche à louer", value: "louer" },
                { text: "Je cherche à vendre", value: "vendre" },
                { text: "Quels sont vos services ?", value: "services" }
            ]
        };
        addMessage(welcomeResponse, 'bot-message');
    }
 
    /**
     * Ajoute un message (et des boutons) à la fenêtre de chat.
     * @param {object} response - L'objet réponse contenant le texte et les boutons.
     * @param {string} className - La classe CSS ('user-message' ou 'bot-message').
     */
    function addMessage(response, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', className);
 
        const messageP = document.createElement('p');
        messageP.innerHTML = response.text; // Utilise innerHTML pour les liens
 
        messageDiv.appendChild(messageP);
 
        const existingQuickReplies = messagesContainer.querySelector('.quick-replies-container');
        if (existingQuickReplies) {
            existingQuickReplies.remove();
        }
 
        if (response.quickReplies && className === 'bot-message') {
            const quickRepliesContainer = document.createElement('div');
            quickRepliesContainer.classList.add('quick-replies-container');
 
            response.quickReplies.forEach(reply => {
                const button = document.createElement('button');
                button.classList.add('quick-reply');
                button.textContent = reply.text;
 
                if (reply.link) {
                    button.onclick = () => window.location.href = reply.link;
                } else if (reply.value) {
                    button.onclick = () => handleUserMessage(reply.value);
                }
                quickRepliesContainer.appendChild(button);
            });
            messageDiv.appendChild(quickRepliesContainer);
        }
 
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
 
    /**
     * Ajoute un indicateur visuel de frappe.
     */
    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot-message', 'typing-indicator');
        typingDiv.innerHTML = `<span></span><span></span><span></span>`;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return typingDiv;
    }
 
    /**
     * Génère une réponse basée sur l'entrée de l'utilisateur.
     */
    function getBotResponse(userInput) {
        const lowerInput = userInput.toLowerCase();
 
        const responses = {
            'bonjour': { text: "Bonjour ! Comment puis-je vous aider ?", quickReplies: [{ text: "Vendre", value: "vendre" }, { text: "Louer", value: "louer" }, { text: "Services", value: "services" }] },
            'salut': { text: "Salut ! En quoi puis-je vous aider ?", quickReplies: [{ text: "Vendre", value: "vendre" }, { text: "Louer", value: "louer" }, { text: "Services", value: "services" }] },
            'vendre': { text: "Super ! Pour vendre un bien, voici des liens utiles :", quickReplies: [{ text: "Voir les biens à vendre", link: "a-vendre.html" }, { text: "Publier une annonce", link: "formulairepublication.html?transaction=vente" }] },
            'louer': { text: "Parfait ! Explorez nos biens disponibles :", quickReplies: [{ text: "Voir les locations", link: "louyer.html" }, { text: "Voir les colocations", link: "colocation.html" }] },
            'colocation': { text: "Vous cherchez une colocation ? C'est par ici :", quickReplies: [{ text: "Offres de colocation", link: "colocation.html" }] },
            'contact': { text: "Pour nous contacter, rendez-vous sur notre page dédiée :", quickReplies: [{ text: "Page Contact", link: "contact.html" }] },
            'agent': { text: "Pour nous contacter, rendez-vous sur notre page dédiée :", quickReplies: [{ text: "Page Contact", link: "contact.html" }] },
            'services': { text: "Nous offrons une gamme complète de services. Jetez un oeil à notre page dédiée.", quickReplies: [{ text: "Découvrir nos services", link: "service.html" }] },
            'merci': { text: "De rien ! N'hésitez pas si vous avez d'autres questions." }
        };
 
        for (const keyword in responses) {
            if (lowerInput.includes(keyword)) {
                return responses[keyword];
            }
        }
 
        return {
            text: "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ? Voici quelques suggestions :",
            quickReplies: [
                { text: "Comment vendre ?", value: "vendre" },
                { text: "Je cherche à louer", value: "louer" },
                { text: "Comment vous contacter ?", value: "contact" }
            ]
        };
    }
});