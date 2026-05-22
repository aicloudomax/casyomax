import { Redirect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ROLES } from '../constants/ApiConstants';

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [initialRoute, setInitialRoute] = useState('/login');
    const router = useRouter();

    useEffect(() => {
        checkLoginState();
    }, []);

    const checkLoginState = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userData = await SecureStore.getItemAsync('userData');

            if (token && userData) {
                const user = JSON.parse(userData);
                setIsLoggedIn(true);

                if (user.role === ROLES.ADMIN) {
                    setInitialRoute('/admin/home');
                } else if (user.role === ROLES.CARETAKER) {
                    setInitialRoute('/caretaker/home');
                } else if (user.role === ROLES.PATIENT) {
                    setInitialRoute('/patient/home');
                }
            }
        } catch (e) {
            console.error('Error checking login state:', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return <Redirect href={initialRoute} />;
}
