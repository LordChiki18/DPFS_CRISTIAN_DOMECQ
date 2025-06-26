'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
    }
  }

  User.init({
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    category: DataTypes.ENUM('Admin', 'User'),
    gender: DataTypes.STRING,
    status: DataTypes.ENUM('active', 'inactive'),
    birthdate: DataTypes.DATEONLY,
    phone: DataTypes.STRING,
    profile_picture: DataTypes.STRING,
    agreePrivacy: {
      type: DataTypes.BOOLEAN
    }

  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
  });
  return User;
};
