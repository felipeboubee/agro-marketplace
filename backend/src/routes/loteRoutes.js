const express = require('express');
const router = express.Router();
const loteController = require('../controllers/loteController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// @route   POST /api/lotes
// @desc    Create a new lote
// @access  Private/Vendedor
router.post('/', 
  auth, 
  roleCheck('vendedor'), 
  upload.array('photos', 10),
  loteController.createLote
);

// @route   GET /api/lotes/seller
// @desc    Get seller's lotes
// @access  Private/Vendedor
router.get('/seller', auth, roleCheck('vendedor'), loteController.getSellerLotes);

// @route   GET /api/lotes/:id
// @desc    Get lote by ID
// @access  Private
router.get('/:id', auth, loteController.getLoteById);

// @route   GET /api/lotes
// @desc    Get all lotes
// @access  Private
router.get('/', auth, loteController.getAllLotes);

// @route   PUT /api/lotes/:id
// @desc    Update lote
// @access  Private/Vendedor
router.put('/:id', auth, roleCheck('vendedor'), loteController.updateLote);

// @route   DELETE /api/lotes/:id
// @desc    Delete lote
// @access  Private/Vendedor
router.delete('/:id', auth, roleCheck('vendedor'), loteController.deleteLote);

module.exports = router;