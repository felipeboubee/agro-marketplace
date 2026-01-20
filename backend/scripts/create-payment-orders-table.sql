-- Create payment_orders table for bank to manage payments

CREATE TABLE IF NOT EXISTS payment_orders (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  payment_term VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  
  -- Commission breakdown
  platform_commission DECIMAL(10,2) NOT NULL,
  bank_commission DECIMAL(10,2) NOT NULL,
  seller_net_amount DECIMAL(10,2) NOT NULL,
  
  -- Bank processing
  status VARCHAR(50) DEFAULT 'pending',
  -- Status: pending, processing, completed, failed, refunded
  
  bank_reference VARCHAR(255),
  bank_api_response TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_transaction_id ON payment_orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_buyer_id ON payment_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_seller_id ON payment_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Add comments
COMMENT ON TABLE payment_orders IS 'Payment orders sent to bank for processing';
COMMENT ON COLUMN payment_orders.status IS 'pending, processing, completed, failed, refunded';
COMMENT ON COLUMN payment_orders.bank_api_response IS 'JSON response from bank API for integration';
