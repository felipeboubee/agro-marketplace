-- Create payment_methods table for buyer payment information

CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payment method type
  payment_type VARCHAR(50) NOT NULL, -- 'bank_transfer', 'credit_card', 'check'
  
  -- Bank transfer details
  bank_name VARCHAR(100),
  account_holder_name VARCHAR(200),
  account_number VARCHAR(50),
  cbu VARCHAR(22), -- CBU argentino
  alias_cbu VARCHAR(50),
  account_type VARCHAR(50), -- 'cuenta_corriente', 'caja_ahorro'
  
  -- Credit card details (stored securely, consider encryption)
  card_holder_name VARCHAR(200),
  card_number_last4 VARCHAR(4), -- Only store last 4 digits
  card_brand VARCHAR(50), -- 'visa', 'mastercard', 'amex'
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,
  
  -- Check details
  check_issuer_name VARCHAR(200),
  check_bank_name VARCHAR(100),
  check_account_number VARCHAR(50),
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'expired'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_payment_type ON payment_methods(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- Add comments
COMMENT ON TABLE payment_methods IS 'Payment methods registered by buyers';
COMMENT ON COLUMN payment_methods.payment_type IS 'bank_transfer, credit_card, check';
COMMENT ON COLUMN payment_methods.card_number_last4 IS 'Only last 4 digits for security';

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX idx_one_default_payment_per_user 
ON payment_methods(user_id) 
WHERE is_default = TRUE;
