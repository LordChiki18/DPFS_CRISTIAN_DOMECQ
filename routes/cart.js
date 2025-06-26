const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Ruta para ver el carrito
router.get('/', cartController.viewCart);

// Ruta para agregar producto al carrito
router.post('/add/:productId', cartController.addToCart);

// Ruta para actualizar cantidad (usa :id que corresponde al cartItemId)
router.post('/update/:id', cartController.updateQuantity);

// Ruta para eliminar item (usa :id que corresponde al cartItemId)
router.post('/remove/:id', cartController.removeItem);

module.exports = router;