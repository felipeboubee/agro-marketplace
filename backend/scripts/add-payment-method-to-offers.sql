-- Add payment_method_id to offers table
ALTER TABLE offers
ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id);

-- Add index for better query performance
CREATE INDEX idx_offers_payment_method ON offers(payment_method_id);

-- Add comment
COMMENT ON COLUMN offers.payment_method_id IS 'Reference to the buyer payment method selected for this offer';
