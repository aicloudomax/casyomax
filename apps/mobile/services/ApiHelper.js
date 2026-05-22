import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
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
        console.log("\n================= 📤 API REQUEST =================\n");
        console.log(`➡️  ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log("🔑 Token:", token ? "Bearer ..." + token.slice(-10) : "No token");
        console.log("🧾 Payload:");
        console.log(JSON.stringify(config.data || {}, null, 2));
        console.log("\n==================================================\n");
        return config;
    },
    (error) => {
        console.log("❌ Request Error:", error?.message || error);
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        console.log("\n================= ✅ API RESPONSE =================\n");
        console.log(`➡️  ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}`);
        console.log(`📥 Status: ${response.status}`);
        console.log("📄 Data:");
        const replacer = (key, value) => {
            // Only truncate the heavy audio data
            if (key === 'audioBase64') {
                return '[AUDIO DATA TRUNCATED]';
            }
            return value;
        };
        console.log(JSON.stringify(response.data || {}, replacer, 2));
        console.log("\n===================================================\n");
        return response;
    },
    (error) => {
        console.log("\n================= ❌ API ERROR =================\n");

        // Handle 401 Unauthorized - Session Expired
        if (error.response?.status === 401 && !isLoggingOut) {
            isLoggingOut = true;
            console.log("🔐 Session expired - triggering auto-logout");
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

        if (error.response) {
            console.log(`➡️  ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}`);
            console.log(`📥 Status: ${error.response.status}`);
            console.log("📄 Error Data:");
            console.log(JSON.stringify(error.response.data || {}, null, 2));
        } else if (error.request) {
            console.log("📡 No Response Received (Network Error)");
            console.log("Make sure your backend is running and accessible.");
            if (API_BASE_URL && API_BASE_URL.includes('localhost')) {
                console.log("⚠️  Warning: You are using 'localhost'. For Android Emulator, use '10.0.2.2'.");
            }
        } else {
            console.log("❗ Unexpected Error:", error.message || error);
        }
        console.log("\n================================================\n");
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
