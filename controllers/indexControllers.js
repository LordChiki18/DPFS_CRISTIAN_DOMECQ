const fs = require('fs');
const path = require('path');
const { Product } = require('../models');
const { Op } = require('sequelize');

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
    productList: async (req, res) => {
        const products = await Product.findAll({
            order: [['title', 'ASC']], // opcional, para ordenar por nombre
            attributes: [
                'id', 'title', 'description', 'category', 'price', 'discount',
                'discount_type', 'sale', 'format', 'author', 'stock', 'tags', 'images',
                'created_at', 'updated_at'
            ]
        });

        products.forEach(product => {
            if (product.discount && product.discount > 0) {
                // Guardamos precio original en oldPrice
                product.oldPrice = parseFloat(product.price);

                // Aplicamos descuento para ajustar price
                if (product.discount_type === 'percentage') {
                    product.price = Math.round(product.oldPrice * (1 - product.discount / 100));
                } else if (product.discount_type === 'fixed') {
                    product.price = Math.round(product.oldPrice - product.discount);
                }
            } else {
                product.oldPrice = null;
            }
        });


return res.render('index', {
    title: 'Home',
    products: products,
    user: req.session.user || null,
    isAuthenticated: req.session.user ? true : false,
});
    },
}

module.exports = indexController;