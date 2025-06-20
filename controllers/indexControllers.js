const fs = require('fs');
const path = require('path');

// Carga los productos desde el archivo JSON
const loadProducts = () => {
    try {
        let dataPath = path.join(__dirname, '../data/products.json');
        const jsonData = fs.readFileSync(dataPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error al leer products.json:', error);
        return [];
    }
};

let indexController = {
    // Renderizado de vistas
    productList: (req, res) => {
        let products = loadProducts();

        products.forEach(product => {
            if (product.discount && product.discountType === 'percentage') {
                // Guardar el precio original si no lo tiene
                if (!product.oldPrice) {
                    product.oldPrice = product.price;
                }
                // Calcular el precio con descuento
                product.price = product.oldPrice - (product.oldPrice * product.discount / 100);
            }
        });

        return res.render('index', {
            title: 'Home',
            products: products,
        });
    },
}

module.exports = indexController;