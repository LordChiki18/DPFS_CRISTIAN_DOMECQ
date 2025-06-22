function isProfileOwner(req, res, next) {
    const user = req.session.user;

    if (user && (String(user.id) === String(req.params.id) || user.category === 'Admin')) {
        return next();
    }

    return res.status(403).send('No autorizado');
}

module.exports = isProfileOwner;
