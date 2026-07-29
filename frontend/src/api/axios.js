import axios from 'axios';

// 1. Export the origin so ComicCard can use it for image URLs
export const API_ORIGIN = 'https://inkburst-backend.onrender.com';

// 2. Setup the Axios instance for your data fetching
const API = axios.create({
  baseURL: `${API_ORIGIN}/api`, 
  withCredentials: true // <-- This tells React to send your login cookie!
});
// 3. Export the default instance
export default API;