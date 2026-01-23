# Validaciones Avanzadas de Métodos de Pago

## Descripción General

Este documento describe las validaciones implementadas en el sistema para garantizar la integridad de los datos de métodos de pago y cuentas bancarias.

## Algoritmo de Luhn para Tarjetas de Crédito

### ¿Qué es el Algoritmo de Luhn?

El algoritmo de Luhn (también conocido como "módulo 10" o "mod 10") es una fórmula de suma de verificación utilizada para validar números de identificación como números de tarjetas de crédito. Fue creado por el científico informático Hans Peter Luhn de IBM en 1954.

### Cómo Funciona

1. **Comenzar desde la derecha**: Se procesan los dígitos de derecha a izquierda
2. **Duplicar dígitos alternados**: Cada segundo dígito se duplica
3. **Sumar dígitos si > 9**: Si el resultado de la duplicación es mayor que 9, se suman los dígitos individuales (o se resta 9)
4. **Sumar todos los dígitos**: Se suman todos los dígitos resultantes
5. **Verificar módulo 10**: Si la suma es divisible por 10, el número es válido

### Ejemplo

Validar el número: 4532 1488 0343 6467

```
Paso 1: Escribir el número de derecha a izquierda
7 6 4 6 3 4 0 8 8 4 1 2 3 5 4

Paso 2: Duplicar cada segundo dígito (marcado con *)
7  6* 4  6* 3  4* 0  8* 8  4* 1  2* 3  5* 4
7  12 4  12 3  8  0  16 8  8  1  4  3  10 4

Paso 3: Si el resultado > 9, sumar dígitos (12 → 1+2=3, 16 → 1+6=7, 10 → 1+0=1)
7  3  4  3  3  8  0  7  8  8  1  4  3  1  4

Paso 4: Sumar todos
7+3+4+3+3+8+0+7+8+8+1+4+3+1+4 = 64

Paso 5: 64 % 10 = 4 ≠ 0, por lo tanto el número es INVÁLIDO
```

### Detección de Marca de Tarjeta

El sistema también detecta automáticamente la marca de la tarjeta basándose en los primeros dígitos:

- **Visa**: Comienza con 4
- **Mastercard**: Comienza con 51-55 o 2221-2720
- **American Express**: Comienza con 34 o 37

## Validación de CBU (Clave Bancaria Uniforme)

### ¿Qué es el CBU?

El CBU es un código de 22 dígitos utilizado en Argentina para identificar de manera única una cuenta bancaria. Cada CBU contiene dos dígitos verificadores que permiten validar su autenticidad.

### Estructura del CBU

```
BBBB SSS C NNNNNNNNNNNNC
```

- **BBBB**: Código del banco (3 dígitos) + dígito verificador del banco (1 dígito)
- **SSS**: Código de sucursal (3 dígitos)
- **C**: Primer dígito verificador (1 dígito)
- **NNNNNNNNNNNNC**: Número de cuenta (13 dígitos) + segundo dígito verificador (1 dígito)

### Algoritmo de Validación

El CBU tiene DOS dígitos verificadores que se calculan usando pesos específicos:

#### Primer Dígito Verificador (posición 8)

Valida los primeros 7 dígitos usando los pesos: [7, 1, 3, 9, 7, 1, 3]

```
Ejemplo: 0110593 (primer bloque de 7 dígitos)
Cálculo:
0*7 + 1*1 + 1*3 + 0*9 + 5*7 + 9*1 + 3*3 = 0+1+3+0+35+9+9 = 57
Dígito verificador = (10 - (57 % 10)) % 10 = (10 - 7) % 10 = 3
```

#### Segundo Dígito Verificador (posición 22)

Valida los dígitos 9-21 usando los pesos: [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]

```
Ejemplo: 0200001234567 (segundo bloque de 13 dígitos)
Se aplica el mismo algoritmo con los pesos correspondientes
```

### Ejemplo Completo

CBU válido: `0110593030001234567890`

- **Bloque 1**: 0110593 con verificador 0
- **Bloque 2**: 0200012345678 con verificador 9

## Validación de Alias CBU

### ¿Qué es un Alias CBU?

Un alias CBU es un identificador alfanumérico más fácil de recordar que representa una cuenta bancaria.

### Reglas de Validación

1. **Longitud**: Entre 6 y 20 caracteres
2. **Caracteres permitidos**: 
   - Letras minúsculas (a-z)
   - Números (0-9)
   - Puntos (.)
   - Guiones (-)
3. **No se permiten**: Mayúsculas, espacios, caracteres especiales

### Ejemplos Válidos

```
- mi.cuenta.banco
- juan.perez.2024
- ventas-empresa
- cuenta123
```

### Ejemplos Inválidos

```
- abc (muy corto, < 6 caracteres)
- Mi.Cuenta.Banco (tiene mayúsculas)
- mi cuenta (tiene espacios)
- usuario@banco (tiene caracteres especiales)
```

## Validación de Fecha de Vencimiento

### Reglas

1. **Mes**: Debe estar entre 1 y 12
2. **Año**: No puede ser anterior al año actual
3. **Vencimiento**: Si es el año actual, el mes no puede ser anterior al mes actual

### Ejemplos

```javascript
// Asumiendo fecha actual: Marzo 2024

validateCardExpiry(12, 2024) // ✅ Válido (Diciembre 2024)
validateCardExpiry(3, 2024)  // ✅ Válido (Marzo 2024)
validateCardExpiry(2, 2024)  // ❌ Inválido (ya pasó)
validateCardExpiry(1, 2023)  // ❌ Inválido (año pasado)
validateCardExpiry(13, 2024) // ❌ Inválido (mes no existe)
```

## Implementación

### Frontend (React)

Las validaciones se encuentran en:
```
frontend/src/utils/paymentValidations.js
```

Se utilizan en:
- `frontend/src/pages/comprador/PaymentMethods.jsx`
- `frontend/src/pages/vendedor/BankAccount.jsx`

### Backend (Node.js/Express)

Las validaciones se encuentran en:
```
backend/src/utils/paymentValidations.js
```

Se utilizan en:
- `backend/src/controllers/paymentMethodController.js`
- `backend/src/controllers/sellerBankAccountController.js`

## Beneficios de las Validaciones

1. **Seguridad**: Previene el almacenamiento de datos incorrectos
2. **Experiencia de Usuario**: Feedback inmediato sobre errores
3. **Integridad de Datos**: Garantiza que solo se procesen datos válidos
4. **Reducción de Errores**: Detecta errores de tipeo antes de guardar
5. **Cumplimiento**: Validaciones acordes a estándares bancarios argentinos

## Flujo de Validación

### Frontend

1. Usuario ingresa datos
2. Validación en tiempo real (onChange/onBlur)
3. Feedback visual inmediato (errores en rojo, éxitos en verde)
4. Validación final antes de enviar (onSubmit)

### Backend

1. Recibe datos del frontend
2. Valida nuevamente (defensa en profundidad)
3. Retorna error 400 si los datos son inválidos
4. Guarda en base de datos solo si pasan todas las validaciones

## Casos de Uso

### Tarjeta de Crédito

```javascript
// Usuario ingresa: 4532 1488 0343 6467
// Sistema valida con Luhn → Detecta Visa → Muestra feedback positivo
```

### CBU

```javascript
// Usuario ingresa: 0110593030002005678901
// Sistema valida estructura → Calcula verificadores → Confirma validez
```

### Alias

```javascript
// Usuario ingresa: mi.alias.banco
// Sistema valida longitud y formato → Confirma validez
```

## Consideraciones de Seguridad

1. **Número completo de tarjeta**: Se valida en el frontend pero NUNCA se almacena completo
2. **Solo últimos 4 dígitos**: Se guardan en la base de datos para identificación
3. **CBU completo**: Se almacena encriptado en la base de datos
4. **Validación dual**: Frontend (UX) + Backend (seguridad)

## Testing

Para probar las validaciones, puedes usar estos números de tarjeta de prueba:

### Visa
- 4111 1111 1111 1111 ✅
- 4532 1488 0343 6467 ✅

### Mastercard
- 5555 5555 5555 4444 ✅
- 5425 2334 3010 9903 ✅

### American Express
- 3782 822463 10005 ✅
- 3714 496353 98431 ✅

### CBU de Prueba
- 0110593030002005678901 (debe validar con el algoritmo)

---

**Nota**: Las validaciones implementadas siguen las especificaciones oficiales de la industria bancaria argentina y los estándares internacionales para tarjetas de crédito.
