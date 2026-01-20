-- Add missing columns to transactions table if they don't exist

-- Check and add final_amount column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='final_amount') 
    THEN
        ALTER TABLE transactions ADD COLUMN final_amount DECIMAL(10,2);
    END IF;
END $$;

-- Check and add platform_commission column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='platform_commission') 
    THEN
        ALTER TABLE transactions ADD COLUMN platform_commission DECIMAL(10,2);
    END IF;
END $$;

-- Check and add bank_commission column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='bank_commission') 
    THEN
        ALTER TABLE transactions ADD COLUMN bank_commission DECIMAL(10,2);
    END IF;
END $$;

-- Check and add seller_net_amount column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='seller_net_amount') 
    THEN
        ALTER TABLE transactions ADD COLUMN seller_net_amount DECIMAL(10,2);
    END IF;
END $$;

-- Check and add actual_weight column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='actual_weight') 
    THEN
        ALTER TABLE transactions ADD COLUMN actual_weight DECIMAL(10,2);
    END IF;
END $$;

-- Check and add balance_ticket_url column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='balance_ticket_url') 
    THEN
        ALTER TABLE transactions ADD COLUMN balance_ticket_url VARCHAR(500);
    END IF;
END $$;

-- Check and add buyer_confirmed_weight column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='buyer_confirmed_weight') 
    THEN
        ALTER TABLE transactions ADD COLUMN buyer_confirmed_weight BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Check and add weight_updated_at column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='weight_updated_at') 
    THEN
        ALTER TABLE transactions ADD COLUMN weight_updated_at TIMESTAMP;
    END IF;
END $$;

-- Check and add buyer_confirmed_at column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='buyer_confirmed_at') 
    THEN
        ALTER TABLE transactions ADD COLUMN buyer_confirmed_at TIMESTAMP;
    END IF;
END $$;

-- Update existing records to calculate commissions if null
UPDATE transactions 
SET 
  final_amount = estimated_total,
  platform_commission = estimated_total * 0.01,
  bank_commission = estimated_total * 0.02,
  seller_net_amount = estimated_total * 0.97
WHERE final_amount IS NULL AND estimated_total IS NOT NULL;
