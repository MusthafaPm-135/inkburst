// src/api.js or wherever you configure Axios
import axios from 'axios';

const API = axios.create({
    // Use the production backend URL if available, otherwise fallback to localhost
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    withCredentials: true // Crucial for cookie authentication
});

export default API;