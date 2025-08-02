const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Ajout d'une sécurité minimale pour les environnements de développement
    secure: process.env.EMAIL_PORT == 465, 
});

const sendEmail = async (to, subject, text, html) => {
    try {
        await transporter.sendMail({
            from: `"Projet Logement" <${process.env.EMAIL_FROM}>`,
            to: to,
            subject: subject,
            text: text,
            html: html
        });
        console.log(`Email de notification envoyé avec succès à ${to}`);
    } catch (error) {
        console.error(`Erreur lors de l'envoi de l'email à ${to}:`, error);
    }
};

module.exports = sendEmail;