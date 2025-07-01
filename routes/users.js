var express = require('express');
var router = express.Router();

let userController = require('../controllers/userControllers');
const isAuthenticated = require('../middlewares/isAuthenticated');
const upload = require('../middlewares/uploadMiddleware.js');
const isProfileOwner = require('../middlewares/isProfileOwner');
const isAdmin = require('../middlewares/isAdmin');
const validateUser = require('../middlewares/validateUser');
const validateLogin = require('../middlewares/validateLogin.js')

/* GET users listing. */
router.get('/admin' , isAdmin, isAuthenticated, userController.adminList);
router.get('/register', validateUser, userController.register);
router.post('/store', validateUser, userController.userRegister);
router.get('/login', userController.login);
router.post('/login', validateLogin, userController.userLogin);
router.get('/change-password', isAuthenticated, (req, res) => {
  res.render('users/changePassword');
});
router.post('/changePassword', isAuthenticated, userController.changePassword);
router.get('/profile', isAuthenticated, userController.profile);
router.get('/profile/:id', isAuthenticated, isProfileOwner, userController.profileView);
router.get('/edit/:id', isAuthenticated, isProfileOwner, userController.profileEdit);
router.put('/edit/:id', upload.single('profile_picture'), userController.userProfile);
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/users/login');
  });
});
router.get('/:id/delete', isAdmin, userController.deleteUser);
router.get('/forgot-password', userController.forgotPasswordForm);
router.post('/forgot-password', userController.handleForgotPasswordForm);
router.get('/reset-password/:id', userController.resetPasswordForm);
router.post('/reset-password/:id', userController.resetPassword);



module.exports = router;
