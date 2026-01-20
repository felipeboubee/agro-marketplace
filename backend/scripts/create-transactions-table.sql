-- Create transactions table for managing the complete purchase flow

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  lote_id INTEGER NOT NULL REFERENCES lotes(id),
  
  -- Price details
  agreed_price_per_kg DECIMAL(10,2) NOT NULL,
  estimated_weight DECIMAL(10,2) NOT NULL,
  estimated_total DECIMAL(10,2) NOT NULL,
  
  -- Actual weight from balance
  actual_weight DECIMAL(10,2),
  balance_ticket_url VARCHAR(500),
  
  -- Final amounts
  final_amount DECIMAL(10,2),
  platform_commission DECIMAL(10,2), -- 1%
  bank_commission DECIMAL(10,2), -- 2%
  seller_net_amount DECIMAL(10,2),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending_weight', 
  -- Status flow: pending_weight -> weight_confirmed -> payment_pending -> payment_processing -> completed
  
  -- Confirmations
  buyer_confirmed_weight BOOLEAN DEFAULT FALSE,
  weight_updated_at TIMESTAMP,
  buyer_confirmed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_offer_id ON transactions(offer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_lote_id ON transactions(lote_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Add comments
COMMENT ON TABLE transactions IS 'Manages the complete purchase transaction flow including weight confirmation and payment';
COMMENT ON COLUMN transactions.status IS 'pending_weight, weight_confirmed, payment_pending, payment_processing, completed, cancelled';
