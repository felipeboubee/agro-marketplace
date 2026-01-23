const Offer = require('../models/Offer');
const Lote = require('../models/Lote');
const Certification = require('../models/Certification');
const Transaction = require('../models/Transaction');
const notificationService = require('../services/notificationService');
const pool = require('../config/database');

// Create a new offer with payment details
exports.createOffer = async (req, res) => {
  try {
    const { loteId } = req.params;
    const { offered_price, original_price, payment_term, payment_method, payment_method_id } = req.body;
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

    // Validate payment_method_id is provided
    if (!payment_method_id) {
      return res.status(400).json({ error: 'Debe seleccionar un método de pago registrado' });
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
      hasCertification,
      payment_method_id
    );

    // Get buyer name for notification
    const buyerResult = await pool.query('SELECT name FROM users WHERE id = $1', [buyerId]);
    const buyerName = buyerResult.rows[0]?.name || 'Comprador';

    // Notify seller about new offer
    await notificationService.notifyOfferReceived(
      lote.seller_id,
      offer.id,
      loteId,
      buyerName,
      parseFloat(offered_price)
    ).catch(err => console.error('Error sending notification:', err));

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

      // Save negotiation date (when seller accepts)
      const negotiationDate = new Date();

      const transaction = await Transaction.create({
        offer_id: offer.id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        lote_id: offer.lote_id,
        agreed_price_per_kg: offer.offered_price,
        estimated_weight: estimatedWeight,
        estimated_total: estimatedTotal,
        quantity: lote.total_count,
        animal_type: lote.animal_type
      });

      // Update transaction with negotiation_date and payment_term
      await pool.query(
        'UPDATE transactions SET negotiation_date = $1, payment_term = $2 WHERE id = $3',
        [negotiationDate, offer.payment_term, transaction.id]
      );

      // Create provisional payment order (85% of estimated total)
      const PaymentOrder = require('../models/PaymentOrder');
      const SellerBankAccount = require('../models/SellerBankAccount');
      
      let sellerBankAccount = null;
      try {
        sellerBankAccount = await SellerBankAccount.getDefault(offer.seller_id);
      } catch (error) {
        console.log('Seller has no bank account configured:', error.message);
      }

      const provisionalAmount = estimatedTotal * 0.85;
      
      // Calculate due_date based on payment_term
      // For non-contado terms, calculate from negotiation date
      let dueDate = new Date(negotiationDate);
      const paymentTerm = offer.payment_term || 'contado';
      
      if (paymentTerm !== 'contado') {
        // Extract days from payment_term (e.g., '30_dias' -> 30)
        const daysMatch = paymentTerm.match(/(\d+)_dias/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          dueDate.setDate(dueDate.getDate() + days);
        }
      }
      // For contado, due_date will be updated when buyer confirms weight
      
      const provisionalPaymentOrder = await PaymentOrder.create({
        transaction_id: transaction.id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        amount: provisionalAmount,
        order_type: 'provisional',
        payment_term: paymentTerm,
        payment_method: offer.payment_method || 'transferencia',
        payment_method_id: offer.payment_method_id || null,
        seller_bank_account_id: sellerBankAccount ? sellerBankAccount.id : null,
        platform_commission: 0,
        bank_commission: 0,
        seller_net_amount: provisionalAmount
      });

      // Update payment order with negotiation_date and due_date
      await pool.query(
        'UPDATE payment_orders SET negotiation_date = $1, due_date = $2 WHERE id = $3',
        [negotiationDate, paymentTerm === 'contado' ? null : dueDate, provisionalPaymentOrder.id]
      );

      // Notify bank about provisional payment order
      if (offer.payment_method_id) {
        const paymentMethodResult = await pool.query(
          'SELECT bank_id FROM payment_methods WHERE id = $1',
          [offer.payment_method_id]
        );
        
        if (paymentMethodResult.rows.length > 0 && paymentMethodResult.rows[0].bank_id) {
          const bankId = paymentMethodResult.rows[0].bank_id;
          const buyerResult = await pool.query('SELECT name FROM users WHERE id = $1', [offer.buyer_id]);
          const buyerName = buyerResult.rows[0]?.name || 'Comprador';
          
          // Get bank name for webhook
          const bankNameResult = await pool.query('SELECT bank_name FROM users WHERE id = $1', [bankId]);
          const bankName = bankNameResult.rows[0]?.bank_name;
          
          // Notify bank
          await notificationService.notifyProvisionalPaymentOrderReceived(
            bankId,
            provisionalPaymentOrder.id,
            provisionalAmount,
            buyerName
          ).catch(err => console.error('Error sending notification:', err));
          
          // Send webhook
          if (bankName) {
            const webhookService = require('../services/webhookService');
            webhookService.sendWebhook(bankName, 'payment_order.created', {
              payment_order_id: provisionalPaymentOrder.id,
              transaction_id: transaction.id,
              buyer_id: offer.buyer_id,
              buyer_name: buyerName,
              seller_id: offer.seller_id,
              amount: provisionalAmount,
              payment_term: offer.payment_term,
              payment_method: offer.payment_method,
              order_type: 'provisional',
              created_at: provisionalPaymentOrder.created_at
            }).catch(err => console.error('Error sending webhook:', err));
          }
        }
      }

      // Reject all other pending offers for this lote
      const otherOffersResult = await pool.query(
        'SELECT id, buyer_id FROM offers WHERE lote_id = $1 AND status = $2 AND id != $3',
        [offer.lote_id, 'pendiente', offerId]
      );

      if (otherOffersResult.rows.length > 0) {
        // Update all other offers to rejected
        await pool.query(
          'UPDATE offers SET status = $1, updated_at = NOW() WHERE lote_id = $2 AND status = $3 AND id != $4',
          ['rechazada', offer.lote_id, 'pendiente', offerId]
        );

        // Notify each rejected buyer
        for (const otherOffer of otherOffersResult.rows) {
          await notificationService.notifyOfferResponse(
            otherOffer.buyer_id,
            otherOffer.id,
            false,
            sellerName
          ).catch(err => console.error('Error sending notification to rejected buyer:', err));
        }
      }
    }

    // Get seller name for notification
    const sellerResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const sellerName = sellerResult.rows[0]?.name || 'Vendedor';

    // Notify buyer about offer response
    await notificationService.notifyOfferResponse(
      offer.buyer_id,
      offerId,
      status === 'aceptada',
      sellerName
    ).catch(err => console.error('Error sending notification:', err));

    res.json({
      message: `Oferta ${status} exitosamente`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Error updating offer status:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ error: 'Error al actualizar el estado de la oferta', details: error.message });
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

    // Get seller name for notification
    const sellerResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const sellerName = sellerResult.rows[0]?.name || 'Vendedor';

    // Notify buyer about counter offer
    await notificationService.notifyCounterOfferReceived(
      offer.buyer_id,
      counterOffer.id,
      sellerName,
      parseFloat(counter_price)
    ).catch(err => console.error('Error sending notification:', err));

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

    // Get buyer name for notification
    const buyerResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const buyerName = buyerResult.rows[0]?.name || 'Comprador';

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

      // Notify seller about counter offer acceptance
      await notificationService.notifyCounterOfferResponse(
        counterOffer.seller_id,
        offerId,
        true,
        buyerName
      ).catch(err => console.error('Error sending notification:', err));

      res.json({
        message: 'Contraoferta aceptada exitosamente',
        offer: updatedOffer
      });
    } else {
      // Reject counter offer
      const updatedOffer = await Offer.updateStatus(offerId, 'rechazada');

      // Notify seller about counter offer rejection
      await notificationService.notifyCounterOfferResponse(
        counterOffer.seller_id,
        offerId,
        false,
        buyerName
      ).catch(err => console.error('Error sending notification:', err));

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
