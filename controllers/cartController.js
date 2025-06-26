const { Cart, CartItem, Product } = require('../models');

const cartController = {
    // Agregar un producto al carrito
    addToCart: async (req, res) => {
        const userId = req.session.user?.id;
        const productId = req.params.productId;
        const quantity = parseInt(req.body.quantity) || 1;

        if (!userId) return res.redirect('/users/login');

        try {
            let cart = await Cart.findOne({ where: { user_id: userId } });

            if (!cart) {
                cart = await Cart.create({ user_id: userId });
            }

            const [item, created] = await CartItem.findOrCreate({
                where: { cart_id: cart.id, product_id: productId },
                defaults: { quantity }
            });

            if (!created) {
                item.quantity += quantity;
                await item.save();
            }

            return res.redirect('/cart');
        } catch (err) {
            console.error('Error addToCart:', err);
            res.status(500).send('Error interno');
        }
    },

    // Ver carrito del usuario
    viewCart: async (req, res) => {
        const userId = req.session.user?.id;
        if (!userId) return res.redirect('/users/login');

        try {
            const cart = await Cart.findOne({
                where: { user_id: userId },
                include: {
                    model: CartItem,
                    include: Product
                }
            });

            const items = cart?.CartItems || [];

            let subtotal = 0;

            const cartDetails = items.map(item => {
                const price = item.Product.price;
                const discount = item.Product.discount || 0; // suponiendo que discount es porcentaje
                const discountedPrice = price - (price * discount / 100);
                const itemSubtotal = discountedPrice * item.quantity;

                subtotal += itemSubtotal;

                return {
                    cartItemId: item.id,
                    productId: item.Product.id,
                    title: item.Product.title,
                    price,                // precio original
                    discountedPrice,      // precio con descuento
                    quantity: item.quantity,
                    subtotal: itemSubtotal,
                    image: item.Product.images?.[0] || 'default.png',
                    discount
                };
            });

            const taxes = subtotal * 0.1; // ejemplo 10% impuesto
            const total = subtotal + taxes;

            res.render('cart/cartView', {
                items: cartDetails,
                subtotal,
                taxes,
                total,
                savedItems: req.session.savedItems || []
            });
        } catch (err) {
            console.error('Error viewCart:', err);
            res.status(500).send('Error interno');
        }
    },

    // Actualizar cantidad de un producto
    updateQuantity: async (req, res) => {
        const cartItemId = req.params.id;  // ✅ ID del CartItem
        const quantity = parseInt(req.body.quantity);

        console.log('CartItem ID:', cartItemId);
        console.log('Nueva cantidad:', quantity);

        // ✅ Validaciones
        if (!cartItemId || isNaN(quantity) || quantity < 0) {
            return res.status(400).send('Parámetros inválidos');
        }

        try {
            const item = await CartItem.findByPk(cartItemId);

            if (!item) {
                console.log('CartItem no encontrado con ID:', cartItemId);
                return res.status(404).send('Item no encontrado');
            }

            // ✅ Si la cantidad es 0, eliminar el item
            if (quantity === 0) {
                await item.destroy();
            } else {
                item.quantity = quantity;
                await item.save();
            }

            res.redirect('/cart');
        } catch (err) {
            console.error('Error updateQuantity:', err);
            res.status(500).send('Error interno');
        }
    },

    // Eliminar producto del carrito
    removeItem: async (req, res) => {
        const cartItemId = req.params.id;  // ✅ Cambié itemId por id para consistencia

        console.log('Eliminando CartItem ID:', cartItemId);

        try {
            const result = await CartItem.destroy({ where: { id: cartItemId } });

            if (result === 0) {
                console.log('No se encontró el CartItem para eliminar:', cartItemId);
                return res.status(404).send('Item no encontrado');
            }

            res.redirect('/cart');
        } catch (err) {
            console.error('Error removeItem:', err);
            res.status(500).send('Error interno');
        }
    }
};

module.exports = cartController;