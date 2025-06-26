const fs = require('fs');
const path = require('path');
const { Product } = require('../models');
const { Op } = require('sequelize');

// Carga los productos desde el archivo JSON
const dataPath = path.join(__dirname, '../data/products.json');

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

const saveProducts = (products) => {
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2), 'utf-8');
};

let productController = {
    // Renderizado de vistas
    adminList: async (req, res) => {
        try {
            const products = await Product.findAll({
                order: [['title', 'ASC']], // opcional, para ordenar por nombre
                attributes: [
                    'id', 'title', 'description', 'category', 'price', 'discount',
                    'discount_type', 'sale', 'format', 'author', 'stock', 'tags', 'images',
                    'created_at', 'updated_at', 'old_price'
                ]
            });

            // Asegurar que images y tags se parseen correctamente si son strings
            const productList = products.map(product => {
                const plain = product.toJSON();

                if (typeof plain.images === 'string') {
                    try { plain.images = JSON.parse(plain.images); } catch { plain.images = []; }
                }

                if (typeof plain.tags === 'string') {
                    try { plain.tags = JSON.parse(plain.tags); } catch { plain.tags = []; }
                }

                console.log('Producto:', plain.title, 'Imágenes:', plain.images);


                return plain;
            });

            res.render('products/adminProductList', { products: productList });
        } catch (error) {
            console.error('❌ Error al cargar productos en adminList:', error);
            res.status(500).send('Error al obtener productos');
        }
    },
    // Lista de Productos
    productList: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 6;
            const offset = (page - 1) * limit;

            const { category = 'all', price = 'all', sort = 'name_asc', q = '' } = req.query;
            const where = {};
            const order = [];

            if (category !== 'all') {
                where.category = category;
            }

            if (price !== 'all') {
                if (price === '100000+') {
                    where.price = { [Op.gte]: 100000 };
                } else {
                    const [min, max] = price.split('-');
                    where.price = { [Op.between]: [parseFloat(min), parseFloat(max)] };
                }
            }

            if (q) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } },
                    { author: { [Op.like]: `%${q}%` } },
                ];
            }

            // Ordenamiento
            switch (sort) {
                case 'price_desc': order.push(['price', 'DESC']); break;
                case 'price_asc': order.push(['price', 'ASC']); break;
                case 'name_desc': order.push(['title', 'DESC']); break;
                case 'name_asc': default: order.push(['title', 'ASC']); break;
            }

            const { rows: products, count } = await Product.findAndCountAll({
                where,
                order,
                limit,
                offset,
                attributes: [
                    'id', 'title', 'description', 'category', 'price', 'discount',
                    'discount_type', 'sale', 'format', 'author', 'stock', 'tags', 'images',
                    'created_at', 'updated_at'
                ]
            });

            products.forEach(product => {
                if (typeof product.images === 'string') {
                    try {
                        product.images = JSON.parse(product.images);
                    } catch (error) {
                        product.images = [];
                    }
                }

                // Calcular oldPrice y ajustar price si tiene descuento
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

            const totalPages = Math.ceil(count / limit);

            return res.render('products/productList', {
                title: 'Lista de Productos',
                products,
                currentPage: page,
                totalPages,
                selectedCategory: category,
                selectedPrice: price,
                selectedSort: sort,
                searchQuery: q,
                user: req.session.user
            });

        } catch (err) {
            console.error('Error en productList:', err);
            res.status(500).send('Error interno del servidor');
        }
    },
    // Detalle de Producto
    productDetail: async (req, res) => {
        try {
            const id = req.params.id;

            // Buscar producto por id en DB, seleccionando solo los atributos que sí existen
            const product = await Product.findOne({
                where: { id },
                attributes: [
                    'id', 'title', 'description', 'category', 'price', 'discount',
                    'discount_type', 'sale', 'format', 'author', 'stock', 'tags', 'images',
                    'created_at', 'updated_at'
                ]
            });

            if (!product) {
                return res.status(404).send('Producto no encontrado');
            }

            // Convertir producto Sequelize a objeto plano (JSON)
            const productCopy = product.toJSON();

            // Parsear imágenes y tags si vienen en string
            if (typeof productCopy.images === 'string') {
                try {
                    productCopy.images = JSON.parse(productCopy.images);
                } catch {
                    productCopy.images = [];
                }
            }
            if (typeof productCopy.tags === 'string') {
                try {
                    productCopy.tags = JSON.parse(productCopy.tags);
                } catch {
                    productCopy.tags = [];
                }
            }

            // Aplicar descuento si corresponde
            if (productCopy.discount && productCopy.discount > 0) {
                productCopy.oldPrice = parseFloat(productCopy.price); // Precio original

                if (productCopy.discount_type === 'percentage') {
                    productCopy.price = Math.round(productCopy.oldPrice * (1 - productCopy.discount / 100));
                } else if (productCopy.discount_type === 'fixed') {
                    productCopy.price = Math.round(productCopy.oldPrice - productCopy.discount);
                }
            } else {
                productCopy.oldPrice = null;
            }

            // Renderizar vista con producto
            return res.render('products/productDetail', {
                title: productCopy.title,
                product: productCopy
            });

        } catch (error) {
            console.error('Error en productDetail:', error);
            return res.status(500).send('Error interno del servidor');
        }
    },
    //Mostrar formulario para creacion de productos
    productCreate: (req, res) => {
        res.render('products/productCreate', { title: 'Administración de Productos' });
    },
    //Funcion para crear productos
    productStore: async (req, res) => {
        try {
            const {
                title, description, category, price, author,
                discount, stock, featured, tags, format, discountType
            } = req.body;

            if (!title || !description || !category || !author || !price) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    received_body: req.body,
                    missing_fields: {
                        title: !title,
                        description: !description,
                        category: !category,
                        author: !author,
                        price: !price
                    }
                });
            }

            const parsedTags = tags
                ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
                : [];

            const imageFilenames = req.files && req.files.length > 0
                ? req.files.map(file => file.filename)
                : [];

            const originalPrice = parseFloat(price);

            console.log(originalPrice)
            const discountValue = parseInt(discount) || 0;
            const type = discountType || 'percentage';

            let finalPrice = originalPrice;

            if (discountValue > 0) {
                if (type === 'percentage') {
                    finalPrice = originalPrice * (1 - discountValue / 100);
                } else if (type === 'fixed') {
                    finalPrice = originalPrice - discountValue;
                    if (finalPrice < 0) finalPrice = 0;
                }
            }

            const newProduct = await Product.create({
                title,
                description,
                category,
                price: finalPrice,
                old_price: originalPrice,
                discount: discountValue,
                discount_type: type,
                sale: discountValue > 0 ? true : false,
                format: format || 'video',
                author,
                stock: stock === '1',
                tags: JSON.stringify(parsedTags),
                images: imageFilenames,
                createdAt: new Date(),
                updatedAt: new Date()
            });


            res.redirect('/products');
        } catch (error) {
            console.error('❌ Error al crear producto:', error);
            res.status(500).send('Error interno al guardar el producto');
        }
    },
    // Mostrar formulario para edicion de productos
    productEdit: async (req, res) => {
        try {
            const id = req.params.id;
            const product = await Product.findByPk(id);

            if (!product) {
                return res.status(404).send('Producto no encontrado');
            }

            const productCopy = product.toJSON();

            // Asegurarse de que tags sea un array
            if (typeof productCopy.tags === 'string') {
                try {
                    productCopy.tags = JSON.parse(productCopy.tags);
                } catch (e) {
                    productCopy.tags = [];
                }
            }

            return res.render('products/productEdit', {
                title: 'Editar Producto',
                product: productCopy
            });

        } catch (error) {
            console.error('❌ Error al cargar producto para editar:', error);
            return res.status(500).send('Error interno del servidor');
        }
    },
    // Funcion para editar productos
    updateProduct: async (req, res) => {
        try {
            const id = req.params.id;
            console.log('📂 Archivos recibidos:', req.files);

            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ error: 'No data received in update' });
            }

            const product = await Product.findByPk(id);
            if (!product) {
                return res.status(404).send('Producto no encontrado');
            }

            // 1. Eliminar imágenes marcadas
            let toDelete = req.body.deleteImages || [];
            if (typeof toDelete === 'string') toDelete = [toDelete];

            let currentImages = Array.isArray(product.images) ? product.images : [];
            if (typeof currentImages === 'string') {
                try { currentImages = JSON.parse(currentImages); } catch { currentImages = []; }
            }

            currentImages = currentImages.filter(img => !toDelete.includes(`/images/products/${img}`));
            toDelete.forEach(imgPath => {
                const filePath = path.join(__dirname, '../public', imgPath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

            // 2. Agregar nuevas imágenes
            const newImages = req.files?.map(file => file.filename) || [];
            currentImages.push(...newImages);

            // 3. Procesar tags
            const parsedTags = req.body.tags
                ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            const discount = parseFloat(req.body.discount) || 0;

            // 4. Actualizar en BD
            await product.update({
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                price: parseFloat(req.body.price),
                discount: parseFloat(req.body.discount) || 0,
                discount_type: req.body.discountType || 'percentage',
                stock: req.body.stock === "1",
                sale: discount > 0 ? true : false,
                author: req.body.author,
                tags: parsedTags,
                format: req.body.format,
                images: currentImages,
                updatedAt: new Date()
            });

            console.log('✅ Producto actualizado correctamente');
            res.redirect('/products');

        } catch (error) {
            console.error('❌ Error al actualizar producto:', error);
            res.status(500).send('Error interno al actualizar el producto');
        }
    },
    // Funcion para eliminar productos
    deleteProduct: async (req, res) => {
        const id = req.params.id;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }
        await Product.destroy({ where: { id } });

        return res.redirect('/products');
    },
};

module.exports = productController;
