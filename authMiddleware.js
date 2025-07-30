const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Récupérer le token du header Authorization
    const authHeader = req.header('Authorization');

    // Vérifier si le header existe
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Accès non autorisé, token manquant.' });
    }

    // Vérifier si le token est au format "Bearer <token>"
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ success: false, message: 'Format du token invalide.' });
    }

    const token = tokenParts[1];

    // Vérifier le token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Ajouter les infos de l'utilisateur à l'objet `req`
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token invalide.' });
    }
};