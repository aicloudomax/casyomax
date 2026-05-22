import axios from 'axios';
import { BASE_URL } from '../constants/apiConstants';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token if available
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const ApiHelper = {
    get: async (url, params = {}) => {
        try {
            const response = await apiClient.get(url, { params });
            return response.data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    post: async (url, data = {}) => {
        try {
            const response = await apiClient.post(url, data);
            return response.data;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    put: async (url, data = {}) => {
        try {
            const response = await apiClient.put(url, data);
            return response.data;
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },

    delete: async (url) => {
        try {
            const response = await apiClient.delete(url);
            return response.data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    },
};

export default ApiHelper;
