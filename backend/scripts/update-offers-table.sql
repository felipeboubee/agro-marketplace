-- Add new fields to offers table for payment and negotiation

ALTER TABLE offers
ADD COLUMN IF NOT EXISTS payment_term VARCHAR(50) DEFAULT 'contado',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS counter_offer_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_counter_offer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_offer_id INTEGER REFERENCES offers(id),
ADD COLUMN IF NOT EXISTS has_buyer_certification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add comment
COMMENT ON COLUMN offers.payment_term IS 'Payment term: contado, 30, 30-60, custom';
COMMENT ON COLUMN offers.payment_method IS 'Payment method: transferencia, tarjeta, cheque';
COMMENT ON COLUMN offers.counter_offer_price IS 'Counter offer price from seller';
COMMENT ON COLUMN offers.is_counter_offer IS 'True if this is a counter offer from seller';
COMMENT ON COLUMN offers.parent_offer_id IS 'Reference to the original offer if this is a counter offer';
