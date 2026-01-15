const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const auth = require('../middleware/auth');

// Add a lote to favorites
router.post('/:loteId', auth, favoriteController.addFavorite);

// Remove a lote from favorites
router.delete('/:loteId', auth, favoriteController.removeFavorite);

// Check if a lote is favorited
router.get('/check/:loteId', auth, favoriteController.checkFavorite);

// Get all my favorites
router.get('/', auth, favoriteController.getMyFavorites);

// Get favorite count for a lote (public)
router.get('/count/:loteId', favoriteController.getFavoriteCount);

module.exports = router;
