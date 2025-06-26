'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
    }
  }
  Product.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    category: DataTypes.ENUM('Ebook', 'Music', 'Course'),
    price: DataTypes.DECIMAL(10, 2),
    old_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
    },
    discount: DataTypes.INTEGER,
    discount_type: DataTypes.ENUM('percentage'),
    sale: DataTypes.BOOLEAN,
    format: DataTypes.STRING,
    author: DataTypes.STRING,
    stock: DataTypes.BOOLEAN,
    tags: {
      type: DataTypes.TEXT,
      get() {
        const raw = this.getDataValue('tags');
        try { return JSON.parse(raw); } catch { return []; }
      },
      set(val) {
        this.setDataValue('tags', JSON.stringify(val));
      }
    },

    images: {
      type: DataTypes.TEXT,
      get() {
        const raw = this.getDataValue('images');
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue('images', JSON.stringify(val));
      }
    }


  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    underscored: true,
  });
  return Product;
};
