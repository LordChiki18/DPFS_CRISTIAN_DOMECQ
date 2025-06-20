var express = require('express');
var router = express.Router();

let userController = require('../controllers/userControllers');

/* GET users listing. */
router.get('/register', userController.register);
router.post('/store', userController.userRegister);
router.get('/login', userController.login);

module.exports = router;
