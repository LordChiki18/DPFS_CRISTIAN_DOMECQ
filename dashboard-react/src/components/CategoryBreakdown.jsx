import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/api';

const CategoryBreakdown = () => {
  const [categories, setCategories] = useState({});

  useEffect(() => {
    fetchProducts().then(res => {
      setCategories(res.data.countByCategory);
    });
  }, []);

  return (
    <div className="categories panel">
      <h2>Productos por categoría</h2>
      <ul>
        {Object.entries(categories).map(([cat, count]) => (
          <li key={cat}>{cat}: {count}</li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryBreakdown;
