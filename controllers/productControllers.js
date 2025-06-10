let productController = {
    productList: (req, res) => {
        return res.render('products/productList', { title: 'Lista de Productos' });
    },
    productDetail: (req, res) => {
        return res.render('products/productDetail', { title: 'Detalle del Producto' + req.params.id });
    },
    productCart: (req, res) => {
        return res.render('products/productCart', { title: 'Carrito de Compras' });
    },
    productCreate: (req, res) => {
        return res.render('products/productCreate', { title: 'Administración de Productos' });
    },
    productEdit: (req, res) => {
        return res.render('products/productEdit', { title: 'Administración de Productos' });
    }
    
//     show: function(req, res) {
//         return res.send(`Hola. Estmaos en la ruta de peliculas con id: ` + req.params.id)
//     },
//     create: function(req, res) {
//         return res.send(`Hola. Estmaos en la ruta de peliculas para crear una nueva pelicula`)
//     }
}

module.exports = productController;