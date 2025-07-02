const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

// Listado completo
router.get('/', userController.listApi);

// Detalle por id
router.get('/:id', userController.detailApi);

module.exports = router;
