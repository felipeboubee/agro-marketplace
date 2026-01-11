-- Agregar nuevos campos a la tabla certifications si no existen
ALTER TABLE certifications 
ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS employment_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS income_proof_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS buyer_status VARCHAR(50) DEFAULT 'pendiente_aprobacion';

-- Actualizar el CHECK constraint para el status
ALTER TABLE certifications 
DROP CONSTRAINT IF EXISTS certifications_status_check;

ALTER TABLE certifications
ADD CONSTRAINT certifications_status_check 
CHECK (status IN ('pendiente_aprobacion', 'aprobado', 'rechazado', 'mas_datos', 'pendiente'));

-- Agregar campo buyer_status a la tabla users si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS buyer_status VARCHAR(50);

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_bank_name ON certifications(bank_name);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);
