import axios from 'axios';
import * as SecureStore from '@/services/SecureStore';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../constants/ApiConstants';
import { logoutUser } from './AuthService';

// Flag to prevent multiple logout calls when several API requests fail simultaneously
let isLoggingOut = false;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - Session Expired
        if (error.response?.status === 401 && !isLoggingOut) {
            isLoggingOut = true;
            Toast.show({
                type: 'error',
                text1: 'Session Expired',
                text2: 'Please log in again.',
                visibilityTime: 3000,
            });
            // Delay logout slightly to let toast show
            setTimeout(async () => {
                await logoutUser();
                isLoggingOut = false;
            }, 500);
        }
        return Promise.reject(error);
    }
);

class ApiHelper {
    static async post(endpoint, body) {
        try {
            const response = await api.post(endpoint, body);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    static async get(endpoint) {
        try {
            const response = await api.get(endpoint);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    static async put(endpoint, body) {
        try {
            const response = await api.put(endpoint, body);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    static async delete(endpoint, body) {
        try {
            const response = await api.delete(endpoint, { data: body });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
}

export default ApiHelper;
