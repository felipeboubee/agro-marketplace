-- Migración: Actualizar tabla certifications para nuevo formato
-- Fecha: 2026-01-12

-- Eliminar columna antigua financial_data
ALTER TABLE certifications DROP COLUMN IF EXISTS financial_data;

-- Agregar nuevas columnas
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}';
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS employment_info JSONB DEFAULT '{}';
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS financial_info JSONB DEFAULT '{}';
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS income_proof_path TEXT;

-- Actualizar status para incluir nuevo estado
ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_status_check;
ALTER TABLE certifications ADD CONSTRAINT certifications_status_check 
  CHECK (status IN ('pendiente_aprobacion', 'aprobado', 'rechazado', 'mas_datos'));

-- Comentarios
COMMENT ON COLUMN certifications.personal_info IS 'Información personal del solicitante (JSON)';
COMMENT ON COLUMN certifications.employment_info IS 'Información laboral del solicitante (JSON)';
COMMENT ON COLUMN certifications.financial_info IS 'Información financiera del solicitante (JSON)';
COMMENT ON COLUMN certifications.income_proof_path IS 'Ruta al archivo de prueba de ingresos';
