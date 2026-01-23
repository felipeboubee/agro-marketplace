-- Add new fields to payment_orders table for provisional/final orders and IVA

-- Add order_type column to differentiate provisional and final orders
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'final';

COMMENT ON COLUMN payment_orders.order_type IS 'provisional: 85% advance payment, final: full payment with IVA';

-- Add IVA fields for final orders
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2);

ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS iva_amount DECIMAL(10,2);

COMMENT ON COLUMN payment_orders.base_amount IS 'Base amount before IVA (only for final orders)';
COMMENT ON COLUMN payment_orders.iva_amount IS 'IVA amount 10.5% (only for final orders)';

-- Update existing records to have order_type = 'final'
UPDATE payment_orders SET order_type = 'final' WHERE order_type IS NULL;
