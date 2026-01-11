const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const certificationController = require('../controllers/certificationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Configurar multer para carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/certifications'));
  },
  filename: (req, file, cb) => {
    cb(null, `income-proof-${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// @route   POST /api/certifications/apply
// @desc    Apply for certification
// @access  Private/Comprador
router.post('/apply', 
  auth, 
  roleCheck('comprador'),
  upload.single('income_proof'),
  certificationController.applyForCertification
);

// @route   GET /api/certifications/my
// @desc    Get user's certifications
// @access  Private/Comprador
router.get('/my', 
  auth, 
  roleCheck('comprador'), 
  certificationController.getUserCertifications
);

// @route   GET /api/certifications/bank/pending
// @desc    Get pending certifications for bank
// @access  Private/Banco
router.get('/bank/pending', 
  auth, 
  roleCheck('banco'), 
  certificationController.getBankPendingCertifications
);

// @route   GET /api/certifications/bank/all
// @desc    Get all certifications for bank
// @access  Private/Banco
router.get('/bank/all', 
  auth, 
  roleCheck('banco'), 
  certificationController.getBankAllCertifications
);

// @route   PUT /api/certifications/:id/status
// @desc    Update certification status
// @access  Private/Banco
router.put('/:id/status', 
  auth, 
  roleCheck('banco'), 
  certificationController.updateCertificationStatus
);

// @route   GET /api/certifications/admin/stats
// @desc    Get certification statistics (admin only)
// @access  Private/Admin
router.get('/admin/stats', 
  auth, 
  roleCheck('admin'), 
  certificationController.getCertificationStats
);

module.exports = router;