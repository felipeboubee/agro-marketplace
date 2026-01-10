const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, { method = "GET", body, headers = {} } = {}) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers
      },
      ...(body && { body: JSON.stringify(body) })
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

  /* =========================
     ENDPOINTS GENERALES
     ========================= */

  health() {
    return this.get("/health");
  }

  login(email, password) {
    return this.post("/auth/login", { email, password });
  }
}

export const api = new ApiService();