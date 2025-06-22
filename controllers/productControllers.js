const fs = require('fs');
const path = require('path');

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
    adminList: (req, res) => {
        const products = loadProducts();
        res.render('products/adminProductList', { products });
    },

    productList: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const clear = req.query.clear;
        const category = req.query.category || 'all';
        const price = req.query.price || 'all';
        const sort = req.query.sort || 'name_asc';
        const limit = 6; // Número de productos por página
        let products = loadProducts();

        if (clear === 'true') {
            return res.redirect('/products');
        }

        if (category !== 'all') {
            products = products.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
        }

        if (price !== 'all') {
            const [min, max] = price.split('-');

            if (price === '100000+') {
                products = products.filter(p => p.price >= 100000);
            } else {
                const minPrice = parseFloat(min);
                const maxPrice = parseFloat(max);
                products = products.filter(p => p.price >= minPrice && p.price <= maxPrice);
            }
        }

        if (sort === 'price_desc') {
            products = products.sort((a, b) => b.price - a.price);
        } else if (sort === 'price_asc') {
            products = products.sort((a, b) => a.price - b.price);
        } else if (sort === 'name_asc') {
            products = products.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'name_desc') {
            products = products.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sort === 'newest') {
            products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === 'oldest') {
            products = products.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

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

        const query = req.query.q || '';
        const searchTerm = query.toLowerCase().trim();

        if (searchTerm) {
            products = products.filter(product => {
                const titleMatch = product.title?.toLowerCase().includes(searchTerm);
                const descriptionMatch = product.description?.toLowerCase().includes(searchTerm);
                const authorMatch = product.author?.toLowerCase().includes(searchTerm);
                const categoryMatch = product.category?.toLowerCase().includes(searchTerm);
                const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
                return titleMatch || descriptionMatch || authorMatch || categoryMatch || tagsMatch;
            });
        }



        const start = (page - 1) * limit;
        const end = start + limit;

        const paginatedProducts = products.slice(start, end);
        const totalPages = Math.ceil(products.length / limit);

        return res.render('products/productList', {
            title: 'Lista de Productos',
            products: paginatedProducts,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: category,
            selectedPrice: price,
            selectedSort: sort,
            user: req.session.user,
            searchQuery: query,
        });
    },

    productDetail: (req, res) => {
        const products = loadProducts();
        const product = products.find(p => p.id == req.params.id);

        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        // Crear una copia para no mutar original
        const productCopy = { ...product };
        console.log('Producto cargado:', productCopy);


        if (productCopy.discount && productCopy.discountType === 'percentage') {
            if (!productCopy.oldPrice) {
                productCopy.oldPrice = productCopy.price;
            }
            productCopy.price = productCopy.oldPrice - (productCopy.oldPrice * productCopy.discount / 100);
        }

        return res.render('products/productDetail', {
            title: productCopy.title,
            product: productCopy
        });

    },

    productCart: (req, res) => {
        return res.render('products/productCart', { title: 'Carrito de Compras' });
    },

    productCreate: (req, res) => {
        res.render('products/productCreate', { title: 'Administración de Productos' });
    },

    productStore: (req, res) => {
        // Log each expected field
        const expectedFields = [
            'title', 'description', 'category', 'price', 'author',
            'discount', 'stock', 'featured', 'tags', 'format'
        ];

        expectedFields.forEach(field => {
            const exists = Object.prototype.hasOwnProperty.call(req.body, field);
            console.log(`${field}: "${req.body[field]}" (exists: ${exists})`);
        });


        // If main fields are missing, return detailed error
        if (!req.body.title || !req.body.description || !req.body.category || !req.body.author) {
            return res.status(400).json({
                error: 'Missing required fields',
                received_body: req.body,
                all_keys: Object.keys(req.body || {}),
                missing_fields: {
                    title: !req.body.title,
                    description: !req.body.description,
                    category: !req.body.category,
                    author: !req.body.author,
                    price: !req.body.price
                }
            });
        }

        const products = loadProducts();

        const newProduct = {
            id: products.length ? products[products.length - 1].id + 1 : 1,
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            price: parseFloat(req.body.price) || 0,
            discount: parseInt(req.body.discount || 0),
            discountType: req.body.discountType || 'percentage',
            sale: req.body.featured === '1',
            format: req.body.format || 'video',
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            author: req.body.author,
            stock: req.body.stock === '1',
            images: req.files.map(file => `/images/products/${file.filename}`),
            createdAt: req.body.createdAt || new Date().toISOString(),
            updatedAt: req.body.updatedAt || new Date().toISOString()
        };

        if (req.files && req.files.length > 0) {
            newProduct.images = req.files.map(file => file.filename);
        }


        console.log('Final product:', JSON.stringify(newProduct, null, 2));

        products.push(newProduct);
        saveProducts(products);

        res.redirect('/products');
    },

    productEdit: (req, res) => {
        const id = req.params.id;

        const allProducts = loadProducts();
        const product = allProducts.find(p => String(p.id) === String(id));

        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        return res.render('products/productEdit', {
            title: 'Administración de Productos',
            product: product
        });
    },
    updateProduct: (req, res) => {
        const id = req.params.id;

        console.log('📂 Archivos recibidos:', req.files);

        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('❌ REQUEST BODY IS EMPTY');
            return res.status(400).json({ error: 'No data received in update' });
        }

        const allProducts = loadProducts();
        const index = allProducts.findIndex(p => String(p.id) === String(id));

        if (index === -1) {
            return res.status(404).send('Producto no encontrado');
        }

        const product = allProducts[index];

        // --- 1. ELIMINAR IMÁGENES MARCADAS ---
        let toDelete = req.body.deleteImages || [];
        if (typeof toDelete === 'string') toDelete = [toDelete];

        product.images = product.images.filter(img => !toDelete.includes(`/images/products/${img}`));

        toDelete.forEach(imgPath => {
            const filePath = path.join(__dirname, '../public', imgPath);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        // --- 2. AGREGAR NUEVAS IMÁGENES SUBIDAS ---
        const newImages = req.files?.map(file => file.filename) || [];
        product.images.push(...newImages);

        // --- 3. ACTUALIZAR OTROS DATOS ---
        const updatedProduct = {
            ...product,
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            price: parseFloat(req.body.price),
            discount: parseFloat(req.body.discount) || 0,
            stock: req.body.stock === "1",
            sale: req.body.featured === "1",
            author: req.body.author,
            tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
            format: req.body.format,
            images: product.images, // Mantener las imágenes actualizadas
            createdAt: product.createdAt, // Mantener la fecha original
            updatedAt: new Date().toISOString()
        };

        allProducts[index] = updatedProduct;
        saveProducts(allProducts);

        console.log('✅ Producto actualizado correctamente');
        res.redirect('/products');
    },

    deleteProduct: (req, res) => {
        const id = req.params.id;
        const allProducts = loadProducts();
        const index = allProducts.findIndex(p => String(p.id) === String(id));

        if (index === -1) {
            return res.status(404).send('Producto no encontrado');
        }

        allProducts.splice(index, 1);
        saveProducts(allProducts);

        return res.redirect('/products');
    },
};

module.exports = productController;
