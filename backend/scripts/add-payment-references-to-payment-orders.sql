-- Add payment_method_id and seller_bank_account_id to payment_orders table
ALTER TABLE payment_orders
ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id),
ADD COLUMN seller_bank_account_id INTEGER REFERENCES seller_bank_accounts(id);

-- Add indexes for better query performance
CREATE INDEX idx_payment_orders_payment_method ON payment_orders(payment_method_id);
CREATE INDEX idx_payment_orders_seller_bank_account ON payment_orders(seller_bank_account_id);

-- Add comments
COMMENT ON COLUMN payment_orders.payment_method_id IS 'Reference to the buyer payment method used for this payment';
COMMENT ON COLUMN payment_orders.seller_bank_account_id IS 'Reference to the seller bank account to receive payment';
