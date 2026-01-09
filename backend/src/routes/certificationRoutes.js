const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   POST /api/certifications/apply
// @desc    Apply for certification
// @access  Private/Comprador
router.post('/apply', 
  auth, 
  roleCheck('comprador'), 
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