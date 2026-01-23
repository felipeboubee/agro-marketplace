-- Add payment date fields to transactions and payment_orders

-- Add negotiation_date to transactions (when seller accepts offer)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS negotiation_date TIMESTAMP;

COMMENT ON COLUMN transactions.negotiation_date IS 'Date when seller accepted the offer (start of payment term calculation)';

-- Add payment_term_days to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_term VARCHAR(50);

COMMENT ON COLUMN transactions.payment_term IS 'Payment term: contado, 30_dias, 60_dias, 90_dias';

-- Add due_date to payment_orders (calculated based on payment_term)
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

COMMENT ON COLUMN payment_orders.due_date IS 'Payment due date based on negotiation_date + payment_term';

-- Add negotiation_date to payment_orders for reference
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS negotiation_date TIMESTAMP;

COMMENT ON COLUMN payment_orders.negotiation_date IS 'Reference to when seller accepted offer';
