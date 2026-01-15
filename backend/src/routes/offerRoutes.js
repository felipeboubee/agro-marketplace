const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const auth = require('../middleware/auth');

// Create an offer for a lote (buyer only)
router.post('/:loteId', auth, offerController.createOffer);

// Get my offers (buyer: sent offers, seller: received offers)
router.get('/', auth, offerController.getMyOffers);

// Get offers for a specific lote (seller only)
router.get('/lote/:loteId', auth, offerController.getLoteOffers);

// Update offer status (seller only)
router.put('/:offerId/status', auth, offerController.updateOfferStatus);

// Delete/cancel an offer (buyer only)
router.delete('/:offerId', auth, offerController.deleteOffer);

module.exports = router;
