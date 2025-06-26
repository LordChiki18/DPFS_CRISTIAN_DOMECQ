'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      category: {
        type: Sequelize.ENUM('Ebook', 'Music', 'Course')
      },
      price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      old_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null
      },
      discount: {
        type: Sequelize.INTEGER
      },
      discount_type: {
        type: Sequelize.ENUM('percentage')
      },
      sale: {
        type: Sequelize.BOOLEAN
      },
      format: {
        type: Sequelize.STRING
      },
      author: {
        type: Sequelize.STRING
      },
      stock: {
        type: Sequelize.BOOLEAN
      },
      tags: {
        type: Sequelize.TEXT
      },
      images: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  }
};
