import React, { useEffect, useState } from 'react';
import { fetchProducts, fetchUsers } from '../services/api';

const TotalPanel = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTotals = async () => {
      try {
        const usersRes = await fetchUsers();
        setTotalUsers(usersRes.data.count);

        const productsRes = await fetchProducts();
        setTotalProducts(productsRes.data.count);

        const categories = productsRes.data.countByCategory || {};
        setTotalCategories(Object.keys(categories).length);
      } catch (err) {
        setError('Error al cargar los totales.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTotals();
  }, []);

  if (loading) return <p className="loading">Cargando totales...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="totals panel">
      <h2>Totales</h2>
      <p><strong>Usuarios:</strong> {totalUsers}</p>
      <p><strong>Productos:</strong> {totalProducts}</p>
      <p><strong>Categorías:</strong> {totalCategories}</p>
    </div>
  );
};

export default TotalPanel;
