const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.originalUrl.includes('/users')) {
      cb(null, path.join(__dirname, '../public/images/users'));
    } else if (req.originalUrl.includes('/products')) {
      cb(null, path.join(__dirname, '../public/images/products'));
    }
  },
  filename: (req, file, cb) => {
    const prefix = req.originalUrl.includes('/users') ? 'profile' : 'product';
    const uniqueName = Date.now() + '-' + prefix + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
