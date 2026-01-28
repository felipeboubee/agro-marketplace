-- Agrega la columna 'videos' para almacenar rutas de videos locales en la tabla lotes
ALTER TABLE lotes
ADD COLUMN videos jsonb DEFAULT '[]';
