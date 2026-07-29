import axios from 'axios';

const API = axios.create({
  baseURL: 'https://inkburst-backend.onrender.com/api', 
  withCredentials: true 
});

// This interceptor automatically grabs the token from localStorage and attaches it!
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;