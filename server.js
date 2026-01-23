const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

dotenv.config(); // Load environment variables from .env file

// Vérification de sécurité : s'assurer que JWT_SECRET est défini
if (!process.env.JWT_SECRET) {
    console.error("ERREUR FATALE : La variable JWT_SECRET n'est pas définie dans le fichier .env");
    process.exit(1);
}

// Import routes
const contactRoutes = require('./contacts.js');
const propertiesRoutes = require('./properties.js');
const usersRoutes = require('./userRoutes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logging

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir les fichiers statiques de la racine (CSS, JS, Images, HTML)
app.use(express.static(path.join(__dirname)));

// Route racine : Renvoyer la page d'accueil (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Use routes without API prefixes
app.use('/contacts', contactRoutes);
app.use('/properties', propertiesRoutes);
app.use('/users', usersRoutes);

// Connect to MongoDB and then start the server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if DB connection fails
  });