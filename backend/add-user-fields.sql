-- Agregar nuevos campos a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cuit_cuil VARCHAR(20);
