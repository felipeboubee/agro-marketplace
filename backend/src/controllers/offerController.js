const Offer = require('../models/Offer');
const Lote = require('../models/Lote');

// Create a new offer
exports.createOffer = async (req, res) => {
  try {
    const { loteId } = req.params;
    const { offered_price, original_price } = req.body;
    const buyerId = req.userId;
    const userType = req.userType;

    // Verify user is a buyer
    if (userType !== 'comprador') {
      return res.status(403).json({ error: 'Solo los compradores pueden hacer ofertas' });
    }

    // Validate input
    if (!offered_price || !original_price) {
      return res.status(400).json({ error: 'Precio ofrecido y precio original son requeridos' });
    }

    // Check if lote exists
    const lote = await Lote.findById(loteId);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    // Check if lote is available
    if (lote.status !== 'ofertado') {
      return res.status(400).json({ error: 'Este lote no está disponible para ofertas' });
    }

    // Create the offer
    const offer = await Offer.create(
      buyerId,
      lote.seller_id,
      loteId,
      parseFloat(offered_price),
      parseFloat(original_price)
    );

    res.status(201).json({
      message: 'Oferta creada exitosamente',
      offer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Error al crear la oferta' });
  }
};

// Get offers for the authenticated user
exports.getMyOffers = async (req, res) => {
  try {
    const userId = req.userId;
    const userType = req.userType;

    let offers;
    if (userType === 'comprador') {
      offers = await Offer.findByBuyerId(userId);
    } else if (userType === 'vendedor') {
      offers = await Offer.findBySellerId(userId);
    } else {
      return res.status(403).json({ error: 'Tipo de usuario no válido' });
    }

    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Error al obtener ofertas' });
  }
};

// Get offers for a specific lote (seller only)
exports.getLoteOffers = async (req, res) => {
  try {
    const { loteId } = req.params;
    const userId = req.userId;
    const userType = req.userType;

    // Verify user is a seller
    if (userType !== 'vendedor') {
      return res.status(403).json({ error: 'Solo los vendedores pueden ver ofertas de sus lotes' });
    }

    // Check if lote exists and belongs to seller
    const lote = await Lote.findById(loteId);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (lote.seller_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver ofertas de este lote' });
    }

    const offers = await Offer.findByLoteId(loteId);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching lote offers:', error);
    res.status(500).json({ error: 'Error al obtener ofertas del lote' });
  }
};

// Update offer status (seller only)
exports.updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    const userType = req.userType;

    // Verify user is a seller
    if (userType !== 'vendedor') {
      return res.status(403).json({ error: 'Solo los vendedores pueden actualizar el estado de las ofertas' });
    }

    // Validate status
    const validStatuses = ['aceptada', 'rechazada'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado de oferta no válido' });
    }

    // Get the offer
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    // Verify seller owns the lote
    if (offer.seller_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta oferta' });
    }

    // Update the offer
    const updatedOffer = await Offer.updateStatus(offerId, status);

    res.json({
      message: `Oferta ${status} exitosamente`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la oferta' });
  }
};

// Delete/cancel an offer
exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.userId;

    // Get the offer
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    // Verify user is the buyer who created the offer
    if (offer.buyer_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta oferta' });
    }

    // Only allow deletion if status is pending
    if (offer.status !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar ofertas pendientes' });
    }

    await Offer.delete(offerId);

    res.json({
      message: 'Oferta cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: 'Error al cancelar la oferta' });
  }
};
