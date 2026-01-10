# Tareas Pendientes - Agro Marketplace

## 🎯 Prioridad CRÍTICA

### 1. **LoteList.jsx** - Remover stats, mejorar filters
**Estado**: No iniciado  
**Dificultad**: ⭐⭐ Medio

**Cambios necesarios**:
- [ ] Remover `<div className="stats-grid">` del componente
- [ ] Remover las 4 stat-cards (totalLotes, ofertadosRecientes, etc.)
- [ ] Copiar el CSS de filters de AdminActivity.jsx
- [ ] Aplicar al panel de filters del LoteList
- [ ] Asegurar que el sidebar llega al final de la página
- [ ] Agregar `min-height: 100vh` al contenedor principal

**Archivos**: 
- `/frontend/src/components/comprador/LoteList.jsx` (líneas ~50-150 remover stats)
- `/frontend/src/styles/dashboard.css` o `/frontend/src/styles/forms.css`

**Código aproximado**:
```jsx
// Remover esto:
<div className="stats-grid">
  <div className="stat-card">...</div>
  ...
</div>

// Mantener solo:
<div className="filters-container">
  <div className="filters-grid">
    {/* Filtros aquí */}
  </div>
</div>

<div className="lotes-list">
  {/* Lotes listados aquí */}
</div>
```

---

### 2. **CertificationForm.jsx** - Reestructurar campos + envío
**Estado**: No iniciado  
**Dificultad**: ⭐⭐⭐ Difícil

**Cambios necesarios**:
- [ ] Remover `<div className="stats-grid">` (igual que LoteList)
- [ ] **Datos Personales** - Restructurar:
  - [ ] Nombre completo → Nombre, Segundo Nombre (opt), Apellido
  - [ ] Nacionalidad → SELECT con lista de países (ver lista abajo)
  - [ ] Fecha nacimiento → `<input type="date" max={today}>`
- [ ] **Información Financiera** - Actualizar:
  - [ ] USD → ARS (cambiar label)
  - [ ] REMOVER "Monto Solicitado"
  - [ ] REMOVER "Finalidad del Crédito"
  - [ ] Agregar "Prueba de Ingresos" (file upload PDF/IMG/DOC)
- [ ] Implementar función de envío que:
  - [ ] POST a `/api/certifications` con los datos
  - [ ] Setee `user.certificationStatus = "pending"`
  - [ ] Guarde en localStorage
  - [ ] Redirija a BuyerDashboard o muestre mensaje de éxito

**Archivos**:
- `/frontend/src/components/comprador/CertificationForm.jsx` (lines 1-end)

**Lista de países**:
```javascript
const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España",
  "Estados Unidos", "Guatemala", "Guyana", "Honduras", "Jamaica",
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
  "República Dominicana", "Surinam", "Uruguay", "Venezuela"
];
```

**Código aproximado**:
```jsx
const today = new Date().toISOString().split('T')[0];

<input 
  type="date" 
  max={today}
  value={formData.birthDate}
  onChange={handleChange}
/>

// File upload
<input 
  type="file"
  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
  onChange={handleFileChange}
/>

// Envío
const handleSubmit = async () => {
  try {
    await api.post('/api/certifications', formData);
    localStorage.setItem('user', JSON.stringify({...user, certificationStatus: 'pending'}));
    navigate('/comprador');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

### 3. **CertificationRequests.jsx** - Implementar completamente
**Estado**: No renderiza nada  
**Dificultad**: ⭐⭐⭐ Difícil

**Cambios necesarios**:
- [ ] Crear tabla para listar solicitudes
- [ ] Agregar columnas: Usuario, Email, Fecha, Status, Acciones
- [ ] Implementar 3 botones de acción:
  - [ ] **Aprobar**: PUT `/api/certifications/{id}/approve` → status='approved'
  - [ ] **Rechazar**: PUT `/api/certifications/{id}/reject` → status='rejected'
  - [ ] **Solicitar Datos**: PUT `/api/certifications/{id}/request-more` → status='pending_info'
- [ ] Cargar solicitudes con GET `/api/certifications/pending`
- [ ] Mostrar modal con detalles al clickear una solicitud

**Archivos**:
- `/frontend/src/components/banco/CertificationRequests.jsx` (crea completo)

**Código aproximado**:
```jsx
import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export default function CertificationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.get('/certifications/pending');
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/certifications/${id}/approve`, { status: 'approved' });
      loadRequests();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <table className="table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Fecha</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id}>
              <td>{req.user_name}</td>
              <td>{req.user_email}</td>
              <td>{new Date(req.created_at).toLocaleDateString()}</td>
              <td>{req.status}</td>
              <td>
                <button onClick={() => handleApprove(req.id)} className="btn btn-success">
                  <CheckCircle size={16} />
                </button>
                <button onClick={() => handleReject(req.id)} className="btn btn-danger">
                  <XCircle size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🎯 Prioridad ALTA

### 4. **CreateLote.jsx** - Dividir ubicación + publicación
**Estado**: No iniciado  
**Dificultad**: ⭐⭐⭐ Difícil

**Cambios necesarios**:
- [ ] Cambiar campo "Ubicación" por 3 campos separados:
  - [ ] Nombre de la Estancia (text)
  - [ ] Localidad (text)
  - [ ] Provincia (SELECT)
- [ ] Implementar envío que:
  - [ ] POST a `/api/lotes` con todos los datos
  - [ ] Guarde las fotos/videos en storage
  - [ ] Setee `status='ofertado'`
  - [ ] Redirija a la página individual del lote
- [ ] Validar que el vendedor solo puede ver/editar sus propios lotes

**Archivos**:
- `/frontend/src/components/vendedor/CreateLote.jsx`

---

### 5. **MyLotes.jsx** - Mejorar CSS y filtros
**Estado**: No iniciado  
**Dificultad**: ⭐⭐ Medio

**Cambios necesarios**:
- [ ] Copiar CSS de filters de AdminActivity.jsx
- [ ] Aplicar al panel de filters
- [ ] Agregar spacing entre stat-cards
- [ ] Asegurar sidebar llega al final (min-height: 100vh)
- [ ] Agregar sort por fecha, columnas

---

### 6. **Settings Tab** - Agregar a dashboards
**Estado**: No iniciado  
**Dificultad**: ⭐⭐⭐ Difícil

**Cambios necesarios**:
- [ ] **SellerDashboard.jsx**: Agregar Settings route
  - [ ] `/vendedor/settings` → Settings component
  - [ ] Formulario para cambiar email, password
- [ ] **BuyerDashboard.jsx**: Agregar Settings route
  - [ ] `/comprador/settings` → Settings component
- [ ] **BankDashboard.jsx**: Agregar Settings route
  - [ ] `/banco/settings` → Settings component
- [ ] Crear componente Settings reutilizable
  - [ ] Campos: Email, Password (current), New Password, Confirm
  - [ ] PUT `/api/users/{id}` para cambios
  - [ ] Validar password actual antes de cambiar

**Archivos**:
- `/frontend/src/components/vendedor/SellerDashboard.jsx` (agregar Settings route)
- `/frontend/src/components/comprador/BuyerDashboard.jsx` (agregar Settings route)
- `/frontend/src/components/banco/BankDashboard.jsx` (agregar Settings route)
- `/frontend/src/components/common/ProfileSettings.jsx` (crear nuevo)

---

### 7. **UsersList dropdown acciones** - Implementar funcionalidad
**Estado**: Dropdown existe, acciones no funcionales  
**Dificultad**: ⭐⭐⭐ Difícil

**Cambios necesarios**:
- [ ] **Ver Detalles**: Modal con datos del usuario
- [ ] **Editar**: Formulario pre-llenado para cambiar datos
- [ ] **Ver Historial**: Tabla con actividades del usuario
- [ ] **Eliminar**: Confirmación + DELETE `/api/users/{id}`

**Archivos**:
- `/frontend/src/pages/admin/UsersList.jsx` (agregar modales y handlers)

---

## 🎯 Prioridad NORMAL

### 8. **AdminSettings opciones** - Aplicar cambios
**Estado**: Opciones existen en UI  
**Dificultad**: ⭐⭐ Medio

**Cambios necesarios**:
- [ ] Conectar opciones a acciones reales
- [ ] localStorage → aplicar en app.js
- [ ] Mostrar confirmación de guardado
- [ ] Validar valores

---

### 9. **BuyerDashboard home** - Mostrar precios y resumen
**Estado**: Página vacía  
**Dificultad**: ⭐⭐⭐ Difícil

**Cambios necesarios**:
- [ ] Integrar API de Liniers: https://www.mercadoagroganadero.com.ar/dll/hacienda1.dll/haciinfo000002
- [ ] Mostrar 5-10 últimas cotizaciones
- [ ] Resumen de lotes en zona preferida
- [ ] Lista de lotes guardados
- [ ] Resumen de transacciones en curso
- [ ] Status de certificación

---

### 10. **Integración Mercado de Liniers**
**Estado**: No iniciado  
**Dificultad**: ⭐⭐⭐⭐ Muy Difícil

**Cambios necesarios**:
- [ ] Crear servicio para scrappear/consumir API de Liniers
- [ ] Almacenar precios en BD (opcional)
- [ ] Mostrar en BuyerDashboard y SellerDashboard
- [ ] Actualizar precios periódicamente

---

## 📋 CHECKLIST RÁPIDO

```
Crítico:
- [ ] 1. LoteList.jsx - Remover stats
- [ ] 2. CertificationForm.jsx - Reestructurar + envío
- [ ] 3. CertificationRequests.jsx - Implementar

Alto:
- [ ] 4. CreateLote.jsx - Dividir ubicación
- [ ] 5. MyLotes.jsx - Mejorar CSS
- [ ] 6. Settings Tab - Agregar a dashboards
- [ ] 7. UsersList acciones - Implementar

Normal:
- [ ] 8. AdminSettings - Aplicar cambios
- [ ] 9. BuyerDashboard home - Precios
- [ ] 10. Liniers API - Integración
```

---

## 📚 RECURSOS

### Endpoints API Necesarios
- POST `/api/certifications` - Enviar solicitud
- PUT `/api/certifications/{id}/approve` - Aprobar
- PUT `/api/certifications/{id}/reject` - Rechazar
- GET `/api/certifications/pending` - Listar pendientes
- POST `/api/lotes` - Crear lote
- PUT `/api/users/{id}` - Actualizar usuario
- GET `/api/users/{id}/activity` - Historial usuario

### Componentes a Crear
- `/frontend/src/components/common/ProfileSettings.jsx`
- `/frontend/src/components/banco/CertificationRequests.jsx` (completo)

### Componentes a Modificar
- `/frontend/src/components/comprador/LoteList.jsx`
- `/frontend/src/components/comprador/CertificationForm.jsx`
- `/frontend/src/components/comprador/BuyerDashboard.jsx`
- `/frontend/src/components/vendedor/CreateLote.jsx`
- `/frontend/src/components/vendedor/MyLotes.jsx`
- `/frontend/src/components/vendedor/SellerDashboard.jsx`
- `/frontend/src/components/banco/BankDashboard.jsx`
- `/frontend/src/pages/admin/UsersList.jsx`

---

**Última actualización**: 2024-01-10  
**Prioridad recomendada**: Crítico → Alto → Normal  
**Estimado de tiempo**: 6-8 horas para todas las tareas
