const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('./models/Contact');
const sendEmail = require('./emailService');

router.post('/', [
    body('name').notEmpty().withMessage('Le nom est obligatoire.'),
    body('email').isEmail().withMessage('Veuillez fournir une adresse email valide.'),
    body('subject').notEmpty().withMessage('Le sujet est obligatoire.'),
    body('message').notEmpty().withMessage('Le message est obligatoire.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    const { name, email, subject, message } = req.body;

    try {
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

        // --- Notification par email à l'admin ---
        const adminEmailSubject = `Nouveau message de contact: ${subject}`;
        const adminEmailText = `Vous avez reçu un nouveau message de ${name} (${email}).\n\nMessage:\n${message}`;
        const adminEmailHtml = `
            <p>Vous avez reçu un nouveau message de <strong>${name}</strong> (<a href="mailto:${email}">${email}</a>).</p>
            <h3>Sujet: ${subject}</h3>
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 2px solid #ccc; padding-left: 1em; margin-left: 1em;">${message.replace(/\n/g, '<br>')}</blockquote>
        `;
        sendEmail(process.env.ADMIN_EMAIL, adminEmailSubject, adminEmailText, adminEmailHtml);
        
        // --- Accusé de réception à l'utilisateur ---
        const userEmailSubject = 'Confirmation de votre message';
        const userEmailText = `Bonjour ${name},\n\nNous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.\n\nCordialement,\nL'équipe Projet Logement`;
        const userEmailHtml = `<p>Bonjour ${name},</p><p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p><p>Cordialement,<br>L'équipe Projet Logement</p>`;
        sendEmail(email, userEmailSubject, userEmailText, userEmailHtml);

        res.status(201).json({ success: true, message: 'Votre message a été envoyé avec succès ! Nous vous avons envoyé un email de confirmation.' });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du contact :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

module.exports = router;