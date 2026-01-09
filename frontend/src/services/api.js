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

    // Evita crash en 204 No Content
    if (res.status === 204) return null;

    return res.json();
  }

  /* =========================
     MÉTODOS GENÉRICOS
     ========================= */

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

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: data
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE"
    });
  }

  /* =========================
     ENDPOINTS CON NOMBRE
     ========================= */

  health() {
    return this.get("/health");
  }

  login(email, password) {
    return this.post("/auth/login", { email, password });
  }

  getUsers() {
    return this.get("/users");
  }

  updateUser(id, payload) {
    return this.put(`/users/${id}`, payload);
  }
}

export const api = new ApiService();
