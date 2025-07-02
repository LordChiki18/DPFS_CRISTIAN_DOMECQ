import React, { useEffect, useState } from 'react';
import { fetchProducts, fetchProductDetail } from '../services/api';

const ProductList = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const loadProductsWithAuthors = async () => {
            try {
                const res = await fetchProducts();
                const basicProducts = res.data.products;

                // Obtener detalle de cada producto
                const detailedProducts = await Promise.all(
                    basicProducts.map(async (p) => {
                        const detailRes = await fetchProductDetail(p.id); // usa el id
                        return detailRes.data; // devuelve el producto detallado (con author)
                    })
                );

                setProducts(detailedProducts);
            } catch (err) {
                console.error("Error al cargar productos:", err);
            }
        };



        loadProductsWithAuthors();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-PY').format(parseInt(price)) + ' Gs';
    };


    return (
        <div className="product-list panel">
            <h2>Listado de Productos</h2>
            <ul>
                {products.map(p => {
                    return (
                        <li key={p.id}>
                            <strong>{p.title}</strong> - {p.category} - {p.author} - {formatPrice(p.price)}.
                        </li>
                    );
                })}

            </ul>
        </div>
    );
};

export default ProductList;
