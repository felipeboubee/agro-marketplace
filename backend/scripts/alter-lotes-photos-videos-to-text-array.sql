-- Cambia las columnas photos y videos a text[] en la tabla lotes

-- 1. Agregar columnas temporales
ALTER TABLE lotes ADD COLUMN photos_tmp text[];
ALTER TABLE lotes ADD COLUMN videos_tmp text[];

-- 2. Copiar datos de jsonb a text[] usando funciones de PostgreSQL
UPDATE lotes SET photos_tmp = ARRAY(SELECT jsonb_array_elements_text(photos));
UPDATE lotes SET videos_tmp = ARRAY(SELECT jsonb_array_elements_text(videos));

-- 3. Eliminar columnas originales
ALTER TABLE lotes DROP COLUMN photos;
ALTER TABLE lotes DROP COLUMN videos;

-- 4. Renombrar columnas temporales
ALTER TABLE lotes RENAME COLUMN photos_tmp TO photos;
ALTER TABLE lotes RENAME COLUMN videos_tmp TO videos;
