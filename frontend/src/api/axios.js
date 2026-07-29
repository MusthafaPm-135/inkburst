import axios from 'axios';

const api = axios.create({
  // Use your live Render backend URL here
  baseURL: 'https://inkburst-backend.onrender.com/api', 
});

export default api;