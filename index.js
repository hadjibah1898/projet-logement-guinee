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

// Servir les fichiers statiques du dossier 'uploads' (si présents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Connexion à MongoDB
// Note : La connexion doit être gérée efficacement pour le serverless
if (mongoose.connection.readyState === 0) {
    if (process.env.MONGODB_URI) {
        mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout après 5s au lieu de 30s par défaut pour éviter que les serverless functions ne pendent
        })
            .then(() => console.log("MongoDB connecté via Vercel"))
            .catch(err => console.error("Erreur connexion MongoDB:", err.message));
    } else {
        console.warn("Attention: MONGODB_URI n'est pas défini dans les variables d'environnement !");
    }
}

// Utilisation des routes
app.use('/users', users);
app.use('/contacts', contacts);
app.use('/properties', properties);

module.exports = app;