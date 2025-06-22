function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.category === 'Admin') {
    return next();
  }
  res.redirect(303, '/users/login');
}

module.exports = isAdmin;