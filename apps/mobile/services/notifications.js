import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ENDPOINTS } from '../constants/ApiConstants';
import ApiHelper from './ApiHelper';

export async function registerForPushNotificationsAsync() {
    let token;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log("Permission:", existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Failed to get push token!');
        return null;
    }

    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.manifest?.extra?.eas?.projectId;
        if (!projectId) {
            console.log("⚠️ Project ID not found. Notifications might not work in development without EAS setup.");
            // Try getting token without projectId (might fail in some envs but worth a try or just return null)
            // token = (await Notifications.getExpoPushTokenAsync()).data; 
            // The above usually fails if no projectId. 
            // We return null to avoid the alert spam.
            return null;
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Expo Token:", token);
    } catch (error) {
        console.error("Error fetching push token:", error);
        // alert("Failed to get push token: " + error.message); // Suppress alert
        return null;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
            name: "Medication Reminders",
            importance: Notifications.AndroidImportance.MAX,
            sound: "medicine_alert.wav", // custom sound
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }


    return token;
}

export async function registerTokenWithBackend(token) {
    if (!token) return;
    try {
        await ApiHelper.post(ENDPOINTS.NOTIFICATIONS.REGISTER, { token });
        console.log("Token registered with backend successfully");
    } catch (error) {
        console.error("Failed to register token with backend:", error);
    }
}
