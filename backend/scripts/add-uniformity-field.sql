-- Agregar columna de uniformidad a la tabla lotes
ALTER TABLE lotes 
ADD COLUMN IF NOT EXISTS uniformity VARCHAR(50) DEFAULT 'uniformidad_media';

-- Actualizar lotes existentes sin uniformidad
UPDATE lotes 
SET uniformity = 'uniformidad_media' 
WHERE uniformity IS NULL;
