const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images/products'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-product' + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
