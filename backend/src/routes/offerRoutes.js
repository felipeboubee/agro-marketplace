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

// Create counter offer (seller negotiates price)
router.post('/:offerId/counter', auth, offerController.createCounterOffer);

// Buyer responds to counter offer
router.post('/:offerId/respond', auth, offerController.respondToCounterOffer);

// Update offer status (seller only)
router.put('/:offerId/status', auth, offerController.updateOfferStatus);

// Delete/cancel an offer (buyer only)
router.delete('/:offerId', auth, offerController.deleteOffer);

module.exports = router;
