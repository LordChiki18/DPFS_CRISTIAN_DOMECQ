var express = require('express');
var router = express.Router();
let  productController = require('../controllers/productControllers');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', productController.productList);
router.get('/cart', productController.productCart);
router.get('/create', productController.productCreate);
router.post('/store', upload.array('images', 5),productController.productStore);
router.get('/:id', productController.productDetail);
router.get('/edit/:id', productController.productEdit);
router.get('/:id/delete', productController.deleteProduct);
router.put('/:id', upload.array('newImages', 5), productController.updateProduct);

module.exports = router;