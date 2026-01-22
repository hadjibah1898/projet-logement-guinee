const express = require('express');
const mongoose = require('mongoose');
const users = require('../users');

const app = express();

app.use(express.json());

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

// Utilisation des routes définies dans users.js
app.use('/api/users', users);

module.exports = app;