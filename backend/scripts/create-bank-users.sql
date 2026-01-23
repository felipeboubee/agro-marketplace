-- Create bank users for each bank in the system
-- Password: Bank@2024 (hashed)

-- List of major Argentine banks
INSERT INTO users (name, email, password, user_type, created_at) 
SELECT name, email, password, user_type, created_at FROM (VALUES
  ('Banco Nación', 'banco.nacion@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Provincia', 'banco.provincia@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Galicia', 'banco.galicia@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Santander', 'banco.santander@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco BBVA', 'banco.bbva@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Macro', 'banco.macro@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco ICBC', 'banco.icbc@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Patagonia', 'banco.patagonia@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Supervielle', 'banco.supervielle@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW()),
  ('Banco Credicoop', 'banco.credicoop@agromarket.com', '$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.', 'banco', NOW())
) AS v(name, email, password, user_type, created_at)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.email = v.email);
