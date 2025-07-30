const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('./models/Contact'); // Importer le modèle Contact

// Route pour gérer la soumission du formulaire de contact
router.post('/', [
    // Validation des champs du formulaire
    body('name').notEmpty().withMessage('Le nom complet est obligatoire.'),
    body('email').isEmail().withMessage('Veuillez fournir une adresse email valide.'),
    body('subject').notEmpty().withMessage('Le sujet est obligatoire.'),
    body('message').notEmpty().withMessage('Le message ne peut pas être vide.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Si des erreurs sont trouvées, les renvoyer au client
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    try {
        // Extraire les données du corps de la requête
        const { name, email, subject, message } = req.body;

        // Créer un nouveau document Contact
        const newContactMessage = new Contact({ name, email, subject, message });

        // Enregistrer le message dans la base de données
        await newContactMessage.save();

        // Répondre avec un message de succès
        res.status(201).json({ success: true, message: 'Votre message a été envoyé avec succès !' });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du message :", error);
        // Répondre avec un message d'erreur
        res.status(500).json({ success: false, message: 'Erreur du serveur lors de l\'envoi du message.' });
    }
});

// Exporter le routeur pour l'utiliser dans l'application principale
module.exports = router;