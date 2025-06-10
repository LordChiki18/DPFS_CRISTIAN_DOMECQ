var express = require('express');
var router = express.Router();

let  productController = require('../controllers/productControllers');

router.get('/', productController.productList);
router.get('/1', productController.productDetail);
router.get('/cart', productController.productCart);
router.get('/createProduct', productController.productCreate);
router.get('/editProduct', productController.productEdit);

module.exports = router;