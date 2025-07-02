const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers');

// Listado completo
router.get('/', productController.listApi);
// Detalle por Id
router.get('/:id', productController.detailApi);

module.exports = router;
