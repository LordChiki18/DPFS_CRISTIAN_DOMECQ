const { body } = require('express-validator');
const { User } = require('../models');

module.exports = [
  body('first_name')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.'),

  body('last_name')
    .notEmpty().withMessage('El apellido es obligatorio.')
    .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres.'),

  body('email')
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('Debe ser un email válido.')
    .custom(async (value) => {
      const existingUser = await User.findOne({ where: { email: value } });
      if (existingUser) {
        throw new Error('Este email ya está registrado.');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe contener una letra mayúscula.')
    .matches(/[a-z]/).withMessage('Debe contener una letra minúscula.')
    .matches(/[0-9]/).withMessage('Debe contener un número.')
    .matches(/[^A-Za-z0-9]/).withMessage('Debe contener un carácter especial.'),

  body('profile_picture')
    .custom((value, { req }) => {
      if (!req.file) return true;
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowed.includes(req.file.mimetype)) {
        throw new Error('La imagen debe ser JPG, JPEG, PNG o GIF');
      }
      return true;
    })
];
