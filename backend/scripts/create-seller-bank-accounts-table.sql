-- Create seller_bank_accounts table for seller payment receiving information

CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bank account details
  bank_name VARCHAR(100) NOT NULL,
  account_holder_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  cbu VARCHAR(22) NOT NULL, -- CBU argentino
  alias_cbu VARCHAR(50),
  account_type VARCHAR(50) NOT NULL, -- 'cuenta_corriente', 'caja_ahorro'
  
  -- Additional info
  branch_number VARCHAR(20),
  swift_code VARCHAR(20), -- For international transfers if needed
  
  -- Status
  is_default BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending_verification'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_user_id ON seller_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_is_default ON seller_bank_accounts(is_default);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_status ON seller_bank_accounts(status);

-- Add comments
COMMENT ON TABLE seller_bank_accounts IS 'Bank accounts for sellers to receive payments';
COMMENT ON COLUMN seller_bank_accounts.cbu IS 'Clave Bancaria Uniforme - Required for Argentine transfers';

-- Ensure only one default bank account per seller
CREATE UNIQUE INDEX idx_one_default_bank_account_per_seller 
ON seller_bank_accounts(user_id) 
WHERE is_default = TRUE;
