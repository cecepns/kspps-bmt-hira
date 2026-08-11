import axios from "axios";

export const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  baseURL: import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/kspps-bmt-hira/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bmt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("bmt_token");
      localStorage.removeItem("bmt_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
