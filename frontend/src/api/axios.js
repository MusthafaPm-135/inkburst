import axios from 'axios';

export const API_ORIGIN = "https://inkburst-backend.onrender.com";

const API = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: !window.__KEYRA_ADMIN__,
  timeout: 65000
});

// THIS IS THE INTERCEPTOR THAT ATTACHES THE TOKEN:
API.interceptors.request.use(
  (config) => {
    if (window.__KEYRA_ADMIN__) config.withCredentials = false;
    const token = window.__KEYRA_ADMIN__ ? sessionStorage.getItem("keyra_admin_token") : localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
