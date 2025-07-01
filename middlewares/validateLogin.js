const { body } = require('express-validator');

module.exports = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido'),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
];
