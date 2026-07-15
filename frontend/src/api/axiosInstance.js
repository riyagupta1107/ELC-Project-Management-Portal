import axios from 'axios';

const axiosInstance = axios.create({
  // Keep browser API calls same-origin. Vite proxies this in development and
  // Nginx proxies it to the backend container in production.
  baseURL: '/api',
});

// Intercept requests and attach the JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
