import axios from "axios";
import Cookies from "js-cookie";

// API Base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const localToken = localStorage.getItem("cmscrm-token");
    const cookieToken = Cookies.get("cmscrm-token");
    const authToken = localToken || cookieToken;

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API endpoints
export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    profile: "/auth/profile",
    verify: "/auth/verify",
    changePassword: "/auth/change-password",
    loginHistory: "/auth/login-history",
  },

  users: {
    list: "/users",
    create: "/users",
    get: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    roles: (id) => `/users/${id}/roles`,
    pages: (id) => `/users/${id}/pages`,
    assignRole: "/users/assign-role",
    removeRole: "/users/remove-role",
  },

  roles: {
    list: "/roles",
    simple: "/roles/simple",
    create: "/roles",
    get: (id) => `/roles/${id}`,
    update: (id) => `/roles/${id}`,
    delete: (id) => `/roles/${id}`,
    pages: (id) => `/roles/${id}/pages`,
    assignPages: "/roles/assign-pages",
    pageOrder: (id) => `/roles/${id}/page-order`,
  },

  pages: {
    list: "/pages",
    simple: "/pages/simple",
    myPages: "/pages/my-pages",
    myPagesHierarchy: "/pages/my-pages-hierarchy",
    create: "/pages",
    get: (id) => `/pages/${id}`,
    update: (id) => `/pages/${id}`,
    delete: (id) => `/pages/${id}`,
    access: (pageUrl) => `/pages/access/${pageUrl}`,
  },

  // Lines
  lines: {
    list: "/lines",
    create: "/lines",
    get: (id) => `/lines/${id}`,
    update: (id) => `/lines/${id}`,
    status: (id) => `/lines/${id}/status`,
    hardDelete: (id) => `/lines/${id}/hard`,
  },

  // Stations
  stations: {
    list: "/stations",
    create: "/stations",
    get: (id) => `/stations/${id}`,
    update: (id) => `/stations/${id}`,
    status: (id) => `/stations/${id}/status`,
    hardDelete: (id) => `/stations/${id}/hard`,
  },

  // Brands
  brands: {
    list: "/brands",
    create: "/brands",
    get: (id) => `/brands/${id}`,
    update: (id) => `/brands/${id}`,
    delete: (id) => `/brands/${id}`,
  },

  // Models
  models: {
    list: "/models",
    create: "/models",
    get: (id) => `/models/${id}`,
    update: (id) => `/models/${id}`,
    delete: (id) => `/models/${id}`,
    byBrand: (id) => `/models/by-brand/${id}`,
  },

  // Audit
audit: {
  config: "/audit/config",
  currentSlot: "/audit/current-slot"
},
  // Inspection Slots
 inspectionSlots: {
  list: "/inspection_slots",
  create: "/inspection_slots",
  get: (id) => `/inspection_slots/${id}`,
  update: (id) => `/inspection_slots/${id}`,
  hardDelete: (id) => `/inspection_slots/${id}/hard`,
  summary: "/inspection_slots/stats/summary",
},
  // Templates
  templates: {
    list: "/templates",
    create: "/templates",
    get: (id) => `/templates/${id}`,
    update: (id) => `/templates/${id}`,
    softDelete: (id) => `/templates/${id}/soft-delete`,
    hardDelete: (id) => `/templates/${id}/hard-delete`,
    restore: (id) => `/templates/${id}/restore`,
  },

  // Template Submissions
  submissions: {
    byTemplate: (templateId) => `/submissions/${templateId}`,
    create: "/submissions",
  },

  // Statistics
  stats: {
    dashboard: "/stats/dashboard",
    activity: "/stats/activity",
    login: "/stats/login",
    api: "/stats/api",
    health: "/stats/health",
    recentActivity: "/stats/recent-activity",
    activeUsers: "/stats/active-users",
  },

  exports: {
    users: "/exports/users",
    roles: "/exports/roles",
    pages: "/exports/pages",
    activityLogs: "/exports/activity-logs",
    loginActivities: "/exports/login-activities",
    download: (filename) => `/exports/download/${filename}`,
  },

  system: {
    performance: "/system/performance",
    info: "/system/info",
    processes: "/system/processes",
    status: "/system/status",
    health: "/system/health",
  },
};

// ✅ API service functions (FIXED GET PARAMS)
export const apiService = {
  // If caller passes { params: {...} } treat it as axios config,
  // else treat it as params object.
  get: (url, paramsOrConfig = {}) => {
    const isAxiosConfig =
      paramsOrConfig &&
      typeof paramsOrConfig === "object" &&
      ("params" in paramsOrConfig ||
        "headers" in paramsOrConfig ||
        "responseType" in paramsOrConfig);

    return isAxiosConfig
      ? api.get(url, paramsOrConfig)
      : api.get(url, { params: paramsOrConfig });
  },

  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),

  upload: (url, formData) =>
    api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  download: async (url, filename) => {
    const response = await api.get(url, { responseType: "blob" });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === "ECONNABORTED") {
      console.error("Request timeout");
    } else if (error?.response) {
      console.error("API Error:", error.response.data);
    } else if (error?.request) {
      console.error("Network Error:", error.request);
    }
    return Promise.reject(error);
  }
);

export default api;