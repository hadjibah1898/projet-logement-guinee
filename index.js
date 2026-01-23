const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const users = require('./userRoutes');
const contacts = require('./contacts');
const properties = require('./properties');

const app = express();

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (HTML, CSS, JS, Images) du dossier racine
app.use(express.static(path.join(__dirname)));

// Connexion à MongoDB
// Note : La connexion doit être gérée efficacement pour le serverless
if (mongoose.connection.readyState === 0) {
    if (process.env.MONGODB_URI) {
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => console.log("MongoDB connecté via Vercel"))
            .catch(err => console.error("Erreur connexion MongoDB:", err));
    } else {
        console.warn("Attention: MONGODB_URI n'est pas défini dans les variables d'environnement !");
    }
}

// Route racine : Renvoyer la page d'accueil (index.html) au lieu du message texte
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Utilisation des routes
app.use('/users', users);
app.use('/contacts', contacts);
app.use('/properties', properties);

module.exports = app;