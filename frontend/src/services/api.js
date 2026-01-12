const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, { method = "GET", body, headers = {} } = {}) {
    const token = localStorage.getItem("token");

    // Determinar si body es FormData
    const isFormData = body instanceof FormData;
    
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers
      },
      ...(body && { body: isFormData ? body : JSON.stringify(body) })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    if (res.status === 204) return null;

    return res.json();
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: data
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: data
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE"
    });
  }

  /* =========================
     ENDPOINTS DE ADMIN
     ========================= */

  // Dashboard
  getDashboardStats() {
    return this.get("/admin/dashboard/stats");
  }

  getDashboardActivity() {
    return this.get("/admin/dashboard/activity");
  }

  // Estadísticas detalladas
  getDetailedStats(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/admin/stats/detailed${queryParams ? `?${queryParams}` : ''}`);
  }

  // Actividad detallada
  getDetailedActivity(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/admin/activity/detailed${queryParams ? `?${queryParams}` : ''}`);
  }

  // Usuarios
  getUsers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/admin/users${queryParams ? `?${queryParams}` : ''}`);
  }

  // Usuario específico
  getUser(id) {
    return this.get(`/users/${id}`);
  }

  updateUser(id, data) {
    return this.put(`/users/${id}`, data);
  }

  getUserActivity(userId) {
    return this.get(`/users/${userId}/activity`);
  }

  /* =========================
     ENDPOINTS DE LOTES
     ========================= */

  getLotes(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/lotes${queryParams ? `?${queryParams}` : ''}`);
  }

  getLote(id) {
    return this.get(`/lotes/${id}`);
  }

  createLote(data) {
    return this.post('/lotes', data);
  }

  updateLote(id, data) {
    return this.put(`/lotes/${id}`, data);
  }

  deleteLote(id) {
    return this.delete(`/lotes/${id}`);
  }

  getSellerLotes() {
    return this.get('/lotes/seller');
  }

  /* =========================
     ENDPOINTS DE CERTIFICACIONES
     ========================= */

  applyCertification(data) {
    return this.post('/certifications/apply', data);
  }

  getMyCertifications() {
    return this.get('/certifications/my');
  }

  getCertifications(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/certifications${queryParams ? `?${queryParams}` : ''}`);
  }

  getBankCertifications(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/certifications/bank/all${queryParams ? `?${queryParams}` : ''}`);
  }

  getBankStats() {
    return this.get('/certifications/bank/stats');
  }

  updateCertificationStatus(id, status, notes = '') {
    return this.put(`/certifications/${id}/status`, { status, notes });
  }

  /* =========================
     ENDPOINTS DE TRANSACCIONES
     ========================= */

  getTransactions(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/transactions${queryParams ? `?${queryParams}` : ''}`);
  }

  getBuyerStats() {
    return this.get('/transactions/buyer/stats');
  }

  createTransaction(data) {
    return this.post('/transactions', data);
  }

  updateTransactionStatus(id, status) {
    return this.put(`/transactions/${id}/status`, { status });
  }

  /* =========================
     ENDPOINTS GENERALES
     ========================= */

  health() {
    return this.get("/health");
  }

  login(email, password) {
    return this.post("/auth/login", { email, password });
  }

  updateProfile(data) {
    return this.put('/users/profile', data);
  }

  changePassword(currentPassword, newPassword) {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }
}

export const api = new ApiService();