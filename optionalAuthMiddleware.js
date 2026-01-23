const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');

    // S'il n'y a pas de header, on continue sans authentifier l'utilisateur
    if (!authHeader) {
        return next();
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return next(); // Format invalide, on continue
    }

    const token = tokenParts[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET).user;
    } catch (err) { /* Token invalide, on ignore et continue */ }
    next();
};