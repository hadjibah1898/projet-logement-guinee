const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('./authMiddleware');
const Property = require('./models/Property');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuration de Multer pour le stockage des images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // S'assurer que le dossier d'upload existe. Le crée s'il n'existe pas.
        // { recursive: true } permet de ne pas planter si le dossier existe déjà.
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Crée un nom de fichier sûr et unique pour éviter les conflits et les problèmes d'encodage.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté. Uniquement JPEG, PNG et WebP sont autorisés.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5MB par fichier
    fileFilter: fileFilter
});

// Route pour soumettre une nouvelle annonce (maintenant avec upload d'images)
router.post('/submit-annonce', [
    authMiddleware,
    upload.array('photos', 10), // Middleware pour gérer jusqu'à 10 fichiers uploadés via le champ 'photos'
    body('titre').notEmpty().withMessage('Le titre est obligatoire'),
    body('description').notEmpty().withMessage('La description est obligatoire'),
    body('type').isIn(['Location', 'Vente', 'Colocation']).withMessage('Le type de transaction est invalide.'),
    body('prix').isNumeric().withMessage('Le prix doit être un nombre'),
    body('surface').isNumeric().withMessage('La surface doit être un nombre'),
    body('adresse').notEmpty().withMessage('L\'adresse est obligatoire'),
    body('ville').notEmpty().withMessage('La ville est obligatoire'),
    body('tel')
        .trim() // Enlever les espaces au début et à la fin
        .notEmpty().withMessage('Le numéro de téléphone est obligatoire.')
        .isNumeric({ no_symbols: true }).withMessage('Le numéro de téléphone ne doit contenir que des chiffres.')
        .isLength({ min: 9, max: 9 }).withMessage('Le numéro de téléphone doit contenir 9 chiffres.')
        .matches(/^6[01256]\d{7}$/).withMessage('Le format du numéro de téléphone est invalide pour la Guinée.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    try {
        const { titre, description, type, prix, surface, adresse, ville, tel } = req.body;

        // Récupérer les chemins des fichiers uploadés et normaliser pour Windows
        const photos = req.files.map(file => file.path.replace(/\\/g, "/"));

        // Créer une nouvelle instance de l'annonce
        const newProperty = new Property({
            titre,
            description,
            type,
            prix,
            surface,
            adresse,
            ville,
            tel,
            photos, // Ajouter les chemins des photos
            auteur: req.user.id
        });

        const property = await newProperty.save();

        // Répondre avec un message de succès
        res.status(201).json({ success: true, message: 'Annonce publiée avec succès!', property });
    } catch (error) {
        console.error("Erreur lors de la soumission de l'annonce :", error);
        res.status(500).json({ success: false, message: 'Erreur lors de la soumission de l\'annonce.' });
    }
});

// Route pour récupérer toutes les annonces (avec filtrage possible)
router.get('/', async (req, res) => {
    try {
        const { type, limit, ville, prix_min, prix_max, surface_min, surface_max } = req.query;
        const filter = {};

        if (type) {
            filter.type = type;
        }

        if (ville) {
            // Utilise une expression régulière pour une recherche insensible à la casse et partielle
            filter.ville = { $regex: ville, $options: 'i' };
        }

        if (prix_min || prix_max) {
            filter.prix = {};
            if (prix_min) filter.prix.$gte = parseInt(prix_min, 10);
            if (prix_max) filter.prix.$lte = parseInt(prix_max, 10);
        }

        if (surface_min || surface_max) {
            filter.surface = {};
            if (surface_min) filter.surface.$gte = parseInt(surface_min, 10);
            if (surface_max) filter.surface.$lte = parseInt(surface_max, 10);
        }

        let query = Property.find(filter).sort({ createdAt: -1 }); // Trier par les plus récentes

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const properties = await query.populate('auteur', 'fullname email');
        res.json({ success: true, properties });
    } catch (error) {
        console.error("Erreur lors de la récupération des annonces :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour récupérer les annonces de l'utilisateur connecté
router.get('/my-listings', authMiddleware, async (req, res) => {
    try {
        const properties = await Property.find({ auteur: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, properties });
    } catch (error) {
        console.error("Erreur lors de la récupération des annonces de l'utilisateur :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour récupérer une annonce par son ID
router.get('/:id', async (req, res) => {
    try {
        // Utilise .populate() pour récupérer les infos de l'auteur liées à l'annonce
        const property = await Property.findById(req.params.id).populate('auteur', 'fullname email');

        if (!property) {
            return res.status(404).json({ success: false, message: 'Annonce non trouvée' });
        }

        res.json({ success: true, property });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'annonce :", error);
        // Gère le cas où l'ID fourni n'est pas un ObjectId valide pour MongoDB
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ success: false, message: 'Annonce non trouvée (ID invalide)' });
        }
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour METTRE À JOUR une annonce (PUT /api/properties/:id)
router.put('/:id', [
    authMiddleware,
    // Vous pouvez ajouter ici les mêmes validations que pour la création
    body('titre').notEmpty().withMessage('Le titre est obligatoire'),
    body('description').notEmpty().withMessage('La description est obligatoire'),
    body('prix').isNumeric().withMessage('Le prix doit être un nombre'),
    body('surface').isNumeric().withMessage('La surface doit être un nombre'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    try {
        let property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ success: false, message: 'Annonce non trouvée.' });
        }

        // Vérifier que l'utilisateur est bien l'auteur de l'annonce
        if (property.auteur.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Action non autorisée.' });
        }

        // Mettre à jour les champs (sans modifier les photos pour le moment)
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // Met à jour avec les champs du corps de la requête
            { new: true }      // Renvoie le document mis à jour
        );

        res.json({ success: true, message: 'Annonce mise à jour avec succès!', property: updatedProperty });
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour SUPPRIMER une annonce (DELETE /api/properties/:id)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ success: false, message: 'Annonce non trouvée.' });
        }

        // Vérifier que l'utilisateur est bien l'auteur de l'annonce
        if (property.auteur.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Action non autorisée. Vous n\'êtes pas l\'auteur de cette annonce.' });
        }

        // Supprimer les images associées du dossier /uploads
        if (property.photos && property.photos.length > 0) {
            property.photos.forEach(photoPath => {
                const fullPath = path.join(__dirname, '..', photoPath);
                fs.unlink(fullPath, err => {
                    if (err) console.error(`Erreur lors de la suppression de l'image ${fullPath}:`, err);
                });
            });
        }

        await Property.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Annonce supprimée avec succès.' });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'annonce :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});


// Exporter le routeur pour l'utiliser dans l'application principale
module.exports = router;