-- Fix payment_orders to ensure payment_term and payment_method match their corresponding offers
-- This script corrects any mismatched data between payment_orders and offers

-- Display current mismatches before fix
SELECT 
  po.id as payment_order_id,
  po.payment_term as po_payment_term,
  po.payment_method as po_payment_method,
  o.payment_term as offer_payment_term,
  o.payment_method as offer_payment_method
FROM payment_orders po
JOIN transactions t ON po.transaction_id = t.id
JOIN offers o ON t.offer_id = o.id
WHERE po.payment_term != o.payment_term OR po.payment_method != o.payment_method;

-- Update payment_orders to match offers
UPDATE payment_orders po
SET 
  payment_term = o.payment_term,
  payment_method = o.payment_method
FROM transactions t
JOIN offers o ON t.offer_id = o.id
WHERE po.transaction_id = t.id
  AND (po.payment_term != o.payment_term OR po.payment_method != o.payment_method);

-- Display confirmation that all records now match
SELECT 
  COUNT(*) as mismatched_records
FROM payment_orders po
JOIN transactions t ON po.transaction_id = t.id
JOIN offers o ON t.offer_id = o.id
WHERE po.payment_term != o.payment_term OR po.payment_method != o.payment_method;

-- Should return 0 mismatched_records
