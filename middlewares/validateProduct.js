const { body } = require('express-validator');

module.exports = [
  body('title')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 5 }).withMessage('El nombre debe tener al menos 5 caracteres.'),

  body('description')
    .notEmpty().withMessage('La descripción es obligatoria.')
    .isLength({ min: 20 }).withMessage('La descripción debe tener al menos 20 caracteres.'),

  body('price')
    .notEmpty().withMessage('El precio es obligatorio.')
    .isFloat({ min: 0 }).withMessage('Debe ser un número mayor o igual a 0.'),

  body('image')
    .custom((value, { req }) => {
      if (!req.files || req.files.length === 0) {
        return true; // No se subió ninguna imagen, no es obligatorio subir una
      }

      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      const invalid = req.files.filter(file => !allowed.includes(file.mimetype));

      if (invalid.length > 0) {
        throw new Error('Todas las imágenes deben ser JPG, JPEG, PNG o GIF.');
      }

      return true;
    })
];
