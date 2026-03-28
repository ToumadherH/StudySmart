import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem("accessToken", access);
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export const sessionService = {
  list: (params = {}) => api.get("/sessions/", { params }),
  create: (data) => api.post("/sessions/", data),
  update: (id, data) => api.patch(`/sessions/${id}/`, data),
  delete: (id) => api.delete(`/sessions/${id}/`),
  markComplete: (id) => api.post(`/sessions/${id}/mark_complete/`),
  upcoming: () => api.get("/sessions/upcoming/"),
  bySubject: (subjectId) =>
    api.get("/sessions/by_subject/", { params: { subject_id: subjectId } }),
};

export const planningService = {
  generate: (weeks = 2, sessionsPerWeek = 10) =>
    api.post("/planning/generate/", {
      weeks,
      sessions_per_week: sessionsPerWeek,
    }),
  list: () => api.get("/planning/"),
  getStats: () => api.get("/planning/stats/"),
  getExamsTimeline: () => api.get("/planning/exams_timeline/"),
};

export const notificationService = {
  list: (params = {}) => api.get("/notifications/", { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_as_read/`),
  markAllRead: () => api.post("/notifications/mark_all_read/"),
  delete: (id) => api.delete(`/notifications/${id}/`),
  getUnreadCount: () => api.get("/notifications/unread_count/"),
};

export const subjectService = {
  list: () => api.get("/subjects/"),
  create: (data) => api.post("/subjects/", data),
  update: (id, data) => api.patch(`/subjects/${id}/`, data),
  delete: (id) => api.delete(`/subjects/${id}/`),
};

export default api;
