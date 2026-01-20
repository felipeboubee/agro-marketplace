const Offer = require('../models/Offer');
const Lote = require('../models/Lote');
const Certification = require('../models/Certification');
const Transaction = require('../models/Transaction');

// Create a new offer with payment details
exports.createOffer = async (req, res) => {
  try {
    const { loteId } = req.params;
    const { offered_price, original_price, payment_term, payment_method } = req.body;
    const buyerId = req.userId;
    const userType = req.userType;

    // Verify user is a buyer
    if (userType !== 'comprador') {
      return res.status(403).json({ error: 'Solo los compradores pueden hacer ofertas' });
    }

    // Validate input
    if (!offered_price || !original_price || !payment_term || !payment_method) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validate payment method based on payment term
    if (payment_term !== 'contado' && payment_method !== 'cheque') {
      return res.status(400).json({ error: 'Solo se acepta cheque para plazos diferentes a contado' });
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

    // Check buyer certification status
    const certifications = await Certification.findByUser(buyerId);
    const hasCertification = certifications.some(cert => cert.status === 'aprobado');

    // Create the offer
    const offer = await Offer.create(
      buyerId,
      lote.seller_id,
      loteId,
      parseFloat(offered_price),
      parseFloat(original_price),
      payment_term,
      payment_method,
      hasCertification
    );

    res.status(201).json({
      message: 'Oferta creada exitosamente',
      offer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al crear la oferta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Update offer status with negotiation support (seller only)
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

    // If accepted, create transaction automatically
    if (status === 'aceptada') {
      const lote = await Lote.findById(offer.lote_id);
      const estimatedWeight = parseFloat(lote.total_count) * parseFloat(lote.average_weight);
      const estimatedTotal = parseFloat(offer.offered_price) * estimatedWeight;

      await Transaction.create({
        offer_id: offer.id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        lote_id: offer.lote_id,
        agreed_price_per_kg: offer.offered_price,
        estimated_weight: estimatedWeight,
        estimated_total: estimatedTotal
      });
    }

    res.json({
      message: `Oferta ${status} exitosamente`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la oferta' });
  }
};

// Create counter offer (seller negotiates price)
exports.createCounterOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { counter_price } = req.body;
    const userId = req.userId;
    const userType = req.userType;

    // Verify user is a seller
    if (userType !== 'vendedor') {
      return res.status(403).json({ error: 'Solo los vendedores pueden hacer contraofertas' });
    }

    // Validate input
    if (!counter_price || counter_price <= 0) {
      return res.status(400).json({ error: 'Precio de contraoferta inválido' });
    }

    // Get the original offer
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    // Verify seller owns the lote
    if (offer.seller_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para negociar esta oferta' });
    }

    // Verify offer is pending
    if (offer.status !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden negociar ofertas pendientes' });
    }

    // Create counter offer
    const counterOffer = await Offer.createCounterOffer(offerId, parseFloat(counter_price));

    res.status(201).json({
      message: 'Contraoferta creada exitosamente',
      counterOffer
    });
  } catch (error) {
    console.error('Error creating counter offer:', error);
    res.status(500).json({ error: 'Error al crear la contraoferta' });
  }
};

// Buyer responds to counter offer
exports.respondToCounterOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { accept } = req.body; // true or false
    const userId = req.userId;
    const userType = req.userType;

    // Verify user is a buyer
    if (userType !== 'comprador') {
      return res.status(403).json({ error: 'Solo los compradores pueden responder a contraofertas' });
    }

    // Get the counter offer
    const counterOffer = await Offer.findById(offerId);
    if (!counterOffer) {
      return res.status(404).json({ error: 'Contraoferta no encontrada' });
    }

    // Verify it's a counter offer
    if (!counterOffer.is_counter_offer) {
      return res.status(400).json({ error: 'Esta no es una contraoferta' });
    }

    // Verify buyer owns this offer
    if (counterOffer.buyer_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para responder a esta contraoferta' });
    }

    if (accept) {
      // Accept counter offer
      const updatedOffer = await Offer.updateStatus(offerId, 'aceptada');

      // Create transaction
      const lote = await Lote.findById(counterOffer.lote_id);
      const estimatedWeight = parseFloat(lote.total_count) * parseFloat(lote.average_weight);
      const estimatedTotal = parseFloat(counterOffer.offered_price) * estimatedWeight;

      await Transaction.create({
        offer_id: counterOffer.id,
        buyer_id: counterOffer.buyer_id,
        seller_id: counterOffer.seller_id,
        lote_id: counterOffer.lote_id,
        agreed_price_per_kg: counterOffer.offered_price,
        estimated_weight: estimatedWeight,
        estimated_total: estimatedTotal
      });

      res.json({
        message: 'Contraoferta aceptada exitosamente',
        offer: updatedOffer
      });
    } else {
      // Reject counter offer
      const updatedOffer = await Offer.updateStatus(offerId, 'rechazada');
      res.json({
        message: 'Contraoferta rechazada',
        offer: updatedOffer
      });
    }
  } catch (error) {
    console.error('Error responding to counter offer:', error);
    res.status(500).json({ error: 'Error al responder a la contraoferta' });
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
