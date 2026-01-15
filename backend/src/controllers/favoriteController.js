const Favorite = require('../models/Favorite');

// Add a lote to favorites
exports.addFavorite = async (req, res) => {
  try {
    const { loteId } = req.params;
    const userId = req.userId;

    const favorite = await Favorite.create(userId, loteId);

    res.status(201).json({
      message: 'Lote agregado a favoritos',
      favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Error al agregar a favoritos' });
  }
};

// Remove a lote from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { loteId } = req.params;
    const userId = req.userId;

    await Favorite.delete(userId, loteId);

    res.json({
      message: 'Lote eliminado de favoritos'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Error al eliminar de favoritos' });
  }
};

// Check if a lote is favorited
exports.checkFavorite = async (req, res) => {
  try {
    const { loteId } = req.params;
    const userId = req.userId;

    const isFavorite = await Favorite.isFavorite(userId, loteId);

    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Error al verificar favorito' });
  }
};

// Get all favorites for the authenticated user
exports.getMyFavorites = async (req, res) => {
  try {
    const userId = req.userId;

    const favorites = await Favorite.findByUserId(userId);

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};

// Get favorite count for a lote
exports.getFavoriteCount = async (req, res) => {
  try {
    const { loteId } = req.params;

    const count = await Favorite.getCountByLoteId(loteId);

    res.json({ count });
  } catch (error) {
    console.error('Error getting favorite count:', error);
    res.status(500).json({ error: 'Error al obtener conteo de favoritos' });
  }
};
