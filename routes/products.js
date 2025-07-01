var express = require('express');
var router = express.Router();
let  productController = require('../controllers/productControllers');
const upload = require('../middlewares/uploadMiddleware');
const isAdmin = require('../middlewares/isAdmin');
const validateProduct = require('../middlewares/validateProduct');


router.get('/', productController.productList);
router.get('/admin' , isAdmin, productController.adminList);
router.get('/create', isAdmin, productController.productCreate);
router.post('/store', isAdmin, upload.array('images', 5), validateProduct, productController.productStore);
router.get('/:id', productController.productDetail);
router.get('/edit/:id', isAdmin, productController.productEdit);
router.get('/:id/delete', isAdmin, productController.deleteProduct);
router.put('/:id', isAdmin, upload.array('newImages', 5), validateProduct, productController.updateProduct);

module.exports = router;