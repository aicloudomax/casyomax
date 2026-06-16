import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CaretakerLayout() {
    const router = useRouter();
    const [profileImage, setProfileImage] = useState(null);
    const [initials, setInitials] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData.profile_image_url) {
                    setProfileImage(userData.profile_image_url);
                } else {
                    const first = userData.first_name ? userData.first_name[0] : '';
                    const last = userData.last_name ? userData.last_name[0] : '';
                    setInitials((first + last).toUpperCase());
                }
            }
        } catch (error) {
            console.log("Error fetching user data for layout:", error);
        }
    };

    return (
        <Stack>
            <Stack.Screen
                name="home"
                options={{ headerShown: false }}
            />
            <Stack.Screen name="profile" options={{ title: 'Caretaker Profile', presentation: 'modal' }} />
            <Stack.Screen name="patient/[id]" options={{ title: 'Patient Details', headerShown: false }} />
        </Stack>
    );
}

const styles = StyleSheet.create({
    profileButton: {
        marginRight: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    initialsContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
