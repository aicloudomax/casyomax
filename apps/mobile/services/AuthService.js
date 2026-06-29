import { router } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import ApiHelper from './ApiHelper';

export const login = async (token, user) => {
    try {
        await SecureStore.setItemAsync('userToken', token);
        // user object now includes 'plan' from the JWT/Backend response
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
    } catch (error) {
        console.error("Error storing login data:", error);
        throw error;
    }
};


export const logoutUser = async () => {
    try {
        // Unregister push token on backend before removing local credentials
        try {
            await ApiHelper.post('/notifications/unregister-token');
        } catch (err) {
            console.log("Failed to unregister push token on logout:", err);
        }

        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');

        // Use replace to reset navigation history
        router.replace('/login');
    } catch (error) {
        console.error("Logout failed:", error);
        // Force navigation even if storage fails
        router.replace('/login');
    }
};

export const getCurrentUser = async () => {
    try {
        const jsonValue = await SecureStore.getItemAsync('userData');
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error("Error reading user data", e);
        return null;
    }
};

export const deleteAccount = async (password) => {
    try {
        const response = await ApiHelper.delete('/users/me', { password });
        if (response.success) {
            await logoutUser();
            return { success: true };
        } else {
            return { success: false, message: response.message || "Failed to delete account" };
        }
    } catch (error) {
        console.error("Delete account error:", error);
        return { success: false, message: error.message || "Network error" };
    }
};
