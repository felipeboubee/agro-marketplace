/**
 * Formatea un número como precio argentino
 * Formato: $ #.##0,00
 * Ejemplo: $ 1.234,56
 */
export const formatPrice = (value) => {
  if (!value && value !== 0) return '$ 0,00';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '$ 0,00';
  
  return '$ ' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formatea un peso en kilogramos
 * Formato: #.##0,00 kg
 * Ejemplo: 1.234,56 kg
 */
export const formatWeight = (value) => {
  if (!value && value !== 0) return '0,00 kg';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0,00 kg';
  
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' kg';
};

/**
 * Formatea un porcentaje
 * Formato: #.##0,00%
 * Ejemplo: 12,34%
 */
export const formatPercentage = (value) => {
  if (!value && value !== 0) return '0,00%';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0,00%';
  
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
};
