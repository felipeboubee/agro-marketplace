# Guía de Integración API para Bancos
## Agro Marketplace - Sistema de Integración Bancaria

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Webhooks](#webhooks)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Manejo de Errores](#manejo-de-errores)

---

## 🎯 Introducción

Este sistema permite a los bancos integrar sus sistemas con Agro Marketplace para:
- Recibir solicitudes de certificación financiera en tiempo real
- Consultar órdenes de pago asignadas
- Recibir notificaciones automáticas vía webhooks

## 🔐 Autenticación

### API Key

Todas las requests deben incluir tu API Key en el header:

```http
X-API-Key: agro_xxxxxxxxxxxxxxxxxxxxxx
```

**Importante:**
- La API Key es única por banco
- Mantenla segura y nunca la compartas públicamente
- Puedes regenerarla desde el panel "Integración API" en tu dashboard

---

## 📡 Endpoints Disponibles

Base URL: `https://agro-marketplace.com/api/bank`

### 1. Obtener Certificaciones

**GET** `/certifications`

Obtiene las solicitudes de certificación asignadas a tu banco.

**Parámetros de consulta:**
- `status` (opcional): `pendiente_aprobacion`, `aprobado`, `rechazado`, `mas_datos`
- `limit` (opcional): Número de resultados (default: 100, max: 500)
- `offset` (opcional): Offset para paginación (default: 0)

**Ejemplo de request:**
```bash
curl -X GET "https://agro-marketplace.com/api/bank/certifications?status=pendiente_aprobacion&limit=50" \
  -H "X-API-Key: agro_your_api_key_here"
```

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 123,
      "user_id": 456,
      "user_name": "Juan Pérez",
      "user_email": "juan@example.com",
      "user_type": "comprador",
      "bank_name": "Banco Nación",
      "status": "pendiente_aprobacion",
      "documento_identidad": "12345678",
      "ingresos_mensuales": 500000,
      "patrimonio": 2000000,
      "deudas": 100000,
      "referencias_bancarias": "Banco XYZ, Cuenta Corriente",
      "comprobante_ingresos_url": "/uploads/certifications/...",
      "balance_url": "/uploads/certifications/...",
      "created_at": "2026-01-21T10:30:00Z",
      "reviewed_at": null,
      "notes": null
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### 2. Obtener Detalles de Certificación

**GET** `/certifications/:id`

Obtiene los detalles completos de una certificación específica.

**Ejemplo:**
```bash
curl -X GET "https://agro-marketplace.com/api/bank/certifications/123" \
  -H "X-API-Key: agro_your_api_key_here"
```

### 3. Obtener Órdenes de Pago

**GET** `/payment-orders`

Obtiene las órdenes de pago asignadas a tu banco.

**Parámetros de consulta:**
- `status` (opcional): `pendiente`, `procesando`, `completado`, `cancelado`
- `limit` (opcional): Número de resultados (default: 100)
- `offset` (opcional): Offset para paginación (default: 0)

**Ejemplo:**
```bash
curl -X GET "https://agro-marketplace.com/api/bank/payment-orders?status=pendiente" \
  -H "X-API-Key: agro_your_api_key_here"
```

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 789,
      "transaction_id": 101,
      "buyer_id": 456,
      "buyer_name": "Juan Pérez",
      "buyer_email": "juan@example.com",
      "seller_id": 789,
      "seller_name": "María García",
      "seller_email": "maria@example.com",
      "amount": 1500000,
      "status": "pendiente",
      "payment_method_id": 12,
      "balance_ticket_url": null,
      "lote_id": 55,
      "animal_type": "Vaca",
      "breed": "Angus",
      "created_at": "2026-01-21T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 100,
    "offset": 0
  }
}
```

### 4. Obtener Detalles de Orden de Pago

**GET** `/payment-orders/:id`

Obtiene los detalles completos de una orden de pago, incluyendo información del método de pago.

**Ejemplo:**
```bash
curl -X GET "https://agro-marketplace.com/api/bank/payment-orders/789" \
  -H "X-API-Key: agro_your_api_key_here"
```

---

## 🔔 Webhooks

Los webhooks permiten recibir notificaciones en tiempo real cuando ocurren eventos relevantes.

### Configuración

1. Accede a "Integración API" en tu dashboard
2. Ingresa la URL de tu webhook (debe ser HTTPS)
3. Guarda el `webhook_secret` proporcionado
4. Prueba la conexión con el botón "Probar Webhook"

### Eventos Disponibles

#### 1. `certification.created`

Se dispara cuando se crea una nueva solicitud de certificación para tu banco.

**Payload:**
```json
{
  "event": "certification.created",
  "timestamp": "2026-01-21T10:30:00Z",
  "data": {
    "certification_id": 123,
    "user_id": 456,
    "user_name": "Juan Pérez",
    "bank_name": "Banco Nación",
    "status": "pendiente_aprobacion",
    "created_at": "2026-01-21T10:30:00Z"
  }
}
```

#### 2. `payment_order.created`

Se dispara cuando se crea una nueva orden de pago asignada a tu banco.

**Payload:**
```json
{
  "event": "payment_order.created",
  "timestamp": "2026-01-21T14:00:00Z",
  "data": {
    "payment_order_id": 789,
    "transaction_id": 101,
    "buyer_id": 456,
    "seller_id": 789,
    "amount": 1500000,
    "status": "pendiente",
    "created_at": "2026-01-21T14:00:00Z"
  }
}
```

### Verificación de Webhooks

Cada webhook incluye el header `X-Webhook-Secret` que debes verificar:

```python
import hmac
import hashlib

def verify_webhook(request):
    received_secret = request.headers.get('X-Webhook-Secret')
    expected_secret = 'whsec_your_webhook_secret'
    
    return hmac.compare_digest(received_secret, expected_secret)
```

### Respuesta Esperada

Tu servidor debe responder con status code 200-299 en menos de 15 segundos:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "received": true
}
```

---

## 💻 Ejemplos de Código

### Python

```python
import requests

API_KEY = 'agro_your_api_key_here'
BASE_URL = 'https://agro-marketplace.com/api/bank'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Obtener certificaciones pendientes
response = requests.get(
    f'{BASE_URL}/certifications',
    headers=headers,
    params={'status': 'pendiente_aprobacion', 'limit': 50}
)

if response.status_code == 200:
    data = response.json()
    for cert in data['data']:
        print(f"Certificación #{cert['id']} - {cert['user_name']}")
else:
    print(f"Error: {response.status_code}")
```

### Node.js

```javascript
const axios = require('axios');

const API_KEY = 'agro_your_api_key_here';
const BASE_URL = 'https://agro-marketplace.com/api/bank';

const headers = {
  'X-API-Key': API_KEY
};

// Obtener órdenes de pago
async function getPaymentOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/payment-orders`, {
      headers,
      params: { status: 'pendiente' }
    });
    
    console.log(`Total órdenes: ${response.data.pagination.total}`);
    response.data.data.forEach(order => {
      console.log(`Orden #${order.id} - $${order.amount}`);
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getPaymentOrders();
```

### PHP

```php
<?php

$apiKey = 'agro_your_api_key_here';
$baseUrl = 'https://agro-marketplace.com/api/bank';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/certifications?status=pendiente_aprobacion');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    $data = json_decode($response, true);
    echo "Total certificaciones: " . $data['pagination']['total'] . "\n";
} else {
    echo "Error: " . $httpCode . "\n";
}
```

### Webhook Receiver (Python/Flask)

```python
from flask import Flask, request, jsonify
import hmac

app = Flask(__name__)
WEBHOOK_SECRET = 'whsec_your_webhook_secret'

@app.route('/webhooks/agro-marketplace', methods=['POST'])
def webhook():
    # Verificar secret
    received_secret = request.headers.get('X-Webhook-Secret', '')
    if not hmac.compare_digest(received_secret, WEBHOOK_SECRET):
        return jsonify({'error': 'Invalid secret'}), 401
    
    # Procesar evento
    payload = request.json
    event_type = payload.get('event')
    
    if event_type == 'certification.created':
        cert_id = payload['data']['certification_id']
        print(f"Nueva certificación: {cert_id}")
        # Procesar en tu sistema...
    
    elif event_type == 'payment_order.created':
        order_id = payload['data']['payment_order_id']
        print(f"Nueva orden de pago: {order_id}")
        # Procesar en tu sistema...
    
    return jsonify({'received': True}), 200

if __name__ == '__main__':
    app.run(port=5000)
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 400 | Request inválido |
| 401 | API Key inválida o faltante |
| 403 | Acceso prohibido |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

### Formato de Error

```json
{
  "error": "Descripción del error",
  "message": "Detalles adicionales (opcional)"
}
```

### Límites de Rate

- **Requests por minuto:** 300
- **Requests por hora:** 10,000

Si excedes el límite, recibirás un error 429 (Too Many Requests).

### Recomendaciones

1. **Implementa reintentos exponenciales** para requests fallidos
2. **Cachea respuestas** cuando sea apropiado
3. **Usa webhooks** en lugar de polling constante
4. **Registra todos los errores** para debugging

---

## 🔧 Soporte

Para soporte técnico:
- **Email:** soporte@agro-marketplace.com
- **Dashboard:** Panel "Integración API" > Ver Logs

---

## 📝 Changelog

### v1.0 (Enero 2026)
- Lanzamiento inicial
- Endpoints de certificaciones y órdenes de pago
- Sistema de webhooks
- Autenticación con API Key
