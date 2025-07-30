const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('./authMiddleware');
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
            res.json({ success: true, message: 'Connexion réussie !', token });
        });
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur lors de la connexion.' });
    }
});

// Route pour qu'un utilisateur devienne un agent
router.put('/become-agent', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        if (user.role === 'agent') {
            return res.status(400).json({ success: false, message: 'Vous êtes déjà un agent.' });
        }

        // Mettre à jour le rôle de l'utilisateur
        user.role = 'agent';
        await user.save({ validateModifiedOnly: true });

        // Créer un nouveau token avec le rôle mis à jour pour une expérience utilisateur fluide
        const payload = {
            user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ success: true, message: 'Félicitations ! Vous êtes maintenant un agent.', token, user: payload.user });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du rôle de l'utilisateur :", error);
        res.status(500).json({ success: false, message: 'Erreur du serveur.' });
    }
});

module.exports = router;