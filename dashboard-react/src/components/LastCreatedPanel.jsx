import React, { useEffect, useState } from 'react';
import { fetchProducts, fetchProductDetail } from '../services/api';

const LastCreatedPanel = () => {
  const [lastProductDetail, setLastProductDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(res => {
        const products = res.data.products;

        if (products && products.length > 0) {
          const last = products.reduce((prev, current) =>
            new Date(prev.createdAt) > new Date(current.createdAt) ? prev : current
          );
          return fetchProductDetail(last.id);
        } else {
          setLoading(false);
          return null;
        }
      })
      .then(detailRes => {
        if (detailRes) {
          setLastProductDetail(detailRes.data);
        }
      })
      .catch(err => {
        console.error("Error al obtener productos o detalle:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(parseInt(price)) + ' Gs';
  };


  if (loading) return <p className="loading">Cargando último producto...</p>;

  if (!lastProductDetail) return <p className="error">No se encontró el último producto.</p>;

  return (
    <div className="last-product panel">
      <h2>Último producto creado - Detalle</h2>
      <p><strong>{lastProductDetail.title}</strong></p>
      <p>{lastProductDetail.description}</p>
      <p><strong>Categoría:</strong> {lastProductDetail.category}</p>
      <p><strong>Precio:</strong> {formatPrice(lastProductDetail.price)}.</p>
      <p><strong>Autor:</strong> {lastProductDetail.author}</p>
      <p><strong>Imagenes:</strong></p>
      {lastProductDetail.images && lastProductDetail.images.length > 0 && (
        <img src={lastProductDetail.images[0]} alt="Producto" width="200" />
      )}
    </div>
  );
};

export default LastCreatedPanel;
