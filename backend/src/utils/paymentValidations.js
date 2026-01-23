/**
 * Validaciones del lado del servidor para métodos de pago
 */

/**
 * Algoritmo de Luhn para validar números de tarjeta de crédito
 * @param {string} cardNumber - Número de tarjeta sin espacios ni guiones
 * @returns {boolean} - true si el número es válido
 */
function validateCreditCard(cardNumber) {
  // Remover espacios y guiones
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');
  
  // Verificar que solo contenga dígitos
  if (!/^\d+$/.test(cleanNumber)) {
    return false;
  }

  // Verificar longitud (típicamente entre 13 y 19 dígitos)
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;

  // Recorrer de derecha a izquierda
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validar formato de CBU argentino (22 dígitos con dígitos verificadores)
 * @param {string} cbu - CBU a validar
 * @returns {boolean} - true si es válido
 */
function validateCBU(cbu) {
  // Remover espacios
  const cleanCBU = cbu.replace(/\s/g, '');

  // Verificar longitud exacta de 22 dígitos
  if (cleanCBU.length !== 22) {
    return false;
  }

  // Verificar que solo contenga dígitos
  if (!/^\d{22}$/.test(cleanCBU)) {
    return false;
  }

  // Validar dígito verificador del bloque 1 (primeros 8 dígitos)
  const block1 = cleanCBU.substring(0, 7);
  const checkDigit1 = parseInt(cleanCBU[7], 10);
  
  const weights1 = [7, 1, 3, 9, 7, 1, 3];
  let sum1 = 0;
  for (let i = 0; i < 7; i++) {
    sum1 += parseInt(block1[i], 10) * weights1[i];
  }
  const calculatedCheckDigit1 = (10 - (sum1 % 10)) % 10;

  if (checkDigit1 !== calculatedCheckDigit1) {
    return false;
  }

  // Validar dígito verificador del bloque 2 (últimos 14 dígitos)
  const block2 = cleanCBU.substring(8, 21);
  const checkDigit2 = parseInt(cleanCBU[21], 10);
  
  const weights2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(block2[i], 10) * weights2[i];
  }
  const calculatedCheckDigit2 = (10 - (sum2 % 10)) % 10;

  if (checkDigit2 !== calculatedCheckDigit2) {
    return false;
  }

  return true;
}

/**
 * Validar fecha de vencimiento de tarjeta
 * @param {number} month - Mes (1-12)
 * @param {number} year - Año (YYYY)
 * @returns {boolean} - true si la tarjeta no ha vencido
 */
function validateCardExpiry(month, year) {
  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validar alias CBU (formato alfanumérico con puntos y guiones)
 * @param {string} alias - Alias a validar
 * @returns {boolean} - true si es válido
 */
function validateCBUAlias(alias) {
  // Alias debe tener entre 6 y 20 caracteres
  if (alias.length < 6 || alias.length > 20) {
    return false;
  }

  // Solo permite letras, números, puntos y guiones
  if (!/^[a-zA-Z0-9.-]+$/.test(alias)) {
    return false;
  }

  return true;
}

/**
 * Validar SWIFT/BIC code
 * @param {string} swift - Código SWIFT
 * @returns {boolean} - true si es válido
 */
function validateSWIFT(swift) {
  // SWIFT debe tener 8 u 11 caracteres
  if (swift.length !== 8 && swift.length !== 11) {
    return false;
  }

  // Formato: AAAABBCCXXX
  const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  
  return swiftRegex.test(swift.toUpperCase());
}

module.exports = {
  validateCreditCard,
  validateCBU,
  validateCardExpiry,
  validateCBUAlias,
  validateSWIFT
};
