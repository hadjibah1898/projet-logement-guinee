const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('./authMiddleware'); // Assumant que ce middleware existe
const User = require('./User');


// Route pour l'inscription (POST /api/users/register)
router.post('/register', [
    body('fullname').notEmpty().withMessage('Le nom complet est obligatoire.'),
    body('email').isEmail().withMessage('Veuillez fournir une adresse email valide.'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    const { fullname, email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'Un utilisateur avec cet email existe déjà.' });
        }

        // Créer un nouvel utilisateur (le mot de passe sera haché par le pre-save hook du modèle)
        user = new User({
            fullname,
            email,
            password
        });

        await user.save();

        res.status(201).json({ success: true, message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' });
    } catch (error) {
        // Gérer spécifiquement l'erreur de duplicata de MongoDB (E11000)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ success: false, message: 'Un utilisateur avec cet email existe déjà.' });
        }

        console.error("Erreur lors de l'inscription :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur lors de l\'inscription.' });
    }
});

// Route pour la connexion (POST /api/users/login)
router.post('/login', [
    body('email').isEmail().withMessage('Veuillez fournir une adresse email valide.'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    const { email, password } = req.body;

    try {
        // Chercher l'utilisateur par email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect.' });
        }

        // Comparer le mot de passe fourni avec celui dans la DB
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect.' });
        }

        // Créer et signer le token JWT
        const payload = {
            user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err,  token) => {
            if (err) throw err;
            res.json({ success: true, message: 'Connexion réussie !', token, user: payload.user });
        });
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur lors de la connexion.' });
    }
});

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // L'ID de l'utilisateur est disponible via req.user.id grâce au middleware d'authentification
        // On sélectionne les champs à ne pas renvoyer, comme le mot de passe.
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }
        // Renvoyer un objet utilisateur propre sans le mot de passe et autres données sensibles
        const userProfile = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            agentApplicationStatus: user.agentApplicationStatus,
            agentProfile: user.agentProfile
        };
        res.json({ success: true, user: userProfile });
    } catch (error) {
        console.error("Erreur lors de la récupération du profil utilisateur :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour qu'un utilisateur devienne un agent
router.put('/become-agent', [
    authMiddleware,
    body('phone')
        .trim()
        .notEmpty().withMessage('Le numéro de téléphone est obligatoire.')
        .isLength({ min: 9, max: 9 }).withMessage('Le numéro de téléphone doit contenir 9 chiffres.')
        .matches(/^6[01256]\d{7}$/).withMessage('Le format du numéro de téléphone est invalide pour la Guinée.'),
    body('agencyName').optional({ checkFalsy: true }).trim().escape(),
    body('experience').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage("L'expérience doit être un nombre positif."),
    body('specialization').optional({ checkFalsy: true }).trim().escape(),
    body('bio').optional({ checkFalsy: true }).trim().escape().isLength({ max: 500 }).withMessage("La biographie ne doit pas dépasser 500 caractères.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    try {
        const { phone, agencyName, experience, specialization, bio } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        if (user.role === 'agent' || user.agentApplicationStatus === 'pending') {
            return res.status(400).json({ success: false, message: 'Vous êtes déjà un agent ou une demande est déjà en cours.' });
        }

        // Enregistrer les informations de la demande et mettre le statut en "pending"
        user.phone = phone;
        user.agentProfile = {
            agencyName: agencyName || '',
            experience: experience || null,
            specialization: specialization || '',
            bio: bio || ''
        };
        user.agentApplicationStatus = 'pending';
        await user.save({ validateModifiedOnly: true });
        
        res.json({ success: true, message: 'Votre demande a été soumise avec succès. Elle sera examinée par un administrateur.' });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du rôle de l'utilisateur :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// --- ROUTES ADMINISTRATEUR POUR LA GESTION DES AGENTS ---

// Middleware simple pour vérifier si l'utilisateur est un admin
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Accès refusé. Droits administrateur requis.' });
    }
};

// Route pour lister toutes les demandes en attente
router.get('/agent-applications', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const applications = await User.find({ agentApplicationStatus: 'pending' }).select('-password -favorites');
        res.json({ success: true, applications });
    } catch (error) {
        console.error("Erreur lors de la récupération des demandes d'agent :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour approuver une demande d'agent
router.put('/approve-agent/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userToApprove = await User.findById(req.params.userId);

        if (!userToApprove) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        if (userToApprove.agentApplicationStatus !== 'pending') {
            return res.status(400).json({ success: false, message: "Cet utilisateur n'a pas de demande en attente." });
        }

        // Mettre à jour le statut et le rôle
        userToApprove.agentApplicationStatus = 'approved';
        userToApprove.role = 'agent';
        await userToApprove.save();

        // TODO: Envoyer une notification par email à l'utilisateur

        res.json({ success: true, message: `L'utilisateur ${userToApprove.fullname} a été promu au rang d'agent.` });
    } catch (error) {
        console.error("Erreur lors de l'approbation de l'agent :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Route pour rejeter une demande d'agent
router.put('/reject-agent/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userToReject = await User.findById(req.params.userId);

        if (!userToReject) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        if (userToReject.agentApplicationStatus !== 'pending') {
            return res.status(400).json({ success: false, message: "Cet utilisateur n'a pas de demande en attente." });
        }

        // Mettre à jour le statut
        userToReject.agentApplicationStatus = 'rejected';
        await userToReject.save();

        // TODO: Envoyer un email de notification de rejet à l'utilisateur
        res.json({ success: true, message: `La demande de ${userToReject.fullname} a été rejetée.` });
    } catch (error) {
        console.error("Erreur lors du rejet de l'agent :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// --- GESTION DES FAVORIS ---

// Ajouter une propriété aux favoris
router.post('/favorites/:propertyId', authMiddleware, async (req, res) => {
    try {
        await User.updateOne({ _id: req.user.id }, { $addToSet: { favorites: req.params.propertyId } });
        res.json({ success: true, message: 'Propriété ajoutée aux favoris.' });
    } catch (error) {
        console.error("Erreur lors de l'ajout aux favoris :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Retirer une propriété des favoris
router.delete('/favorites/:propertyId', authMiddleware, async (req, res) => {
    try {
        await User.updateOne({ _id: req.user.id }, { $pull: { favorites: req.params.propertyId } });
        res.json({ success: true, message: 'Propriété retirée des favoris.' });
    } catch (error) {
        console.error("Erreur lors de la suppression des favoris :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

// Récupérer les annonces favorites de l'utilisateur
router.get('/favorites', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id).populate('favorites');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    res.json({ success: true, favorites: user.favorites });
});

// Route pour changer le mot de passe de l'utilisateur
router.put('/change-password', [
    authMiddleware,
    body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis.'),
    body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(' ') });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        // Vérifier si le mot de passe actuel est correct
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Le mot de passe actuel est incorrect.' });
        }

        // Mettre à jour avec le nouveau mot de passe (le hook pre-save s'occupera du hachage)
        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
    } catch (error) {
        console.error("Erreur lors du changement de mot de passe :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

module.exports = router;