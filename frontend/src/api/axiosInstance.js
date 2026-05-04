import axios from 'axios';
import { auth } from '../firebase';

const axiosInstance = axios.create({
    // Automatically uses the URL from your .env file
    baseURL: "http://localhost:5000/api",
});

// This "Interceptor" runs automatically BEFORE every request
axiosInstance.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            // Automatically attach the token to the headers!
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;