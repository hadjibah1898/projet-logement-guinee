const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

dotenv.config(); // Load environment variables from .env file

// Import routes
const contactRoutes = require('./contacts.js');
const propertiesRoutes = require('./properties.js');
const usersRoutes = require('./users.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logging

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define a root route for testing
app.get('/', (req, res) => {
  res.send('Hello World! The server is running.');
});

// Use routes with API prefixes
app.use('/api/contacts', contactRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/users', usersRoutes);

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