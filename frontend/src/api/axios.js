import axios from 'axios';

export const API_ORIGIN = "https://inkburst-backend.onrender.com";

const API = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true
});

// THIS IS THE INTERCEPTOR THAT ATTACHES THE TOKEN:
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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