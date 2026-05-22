import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function AdminLayout() {
    const router = useRouter();

    return (
        <Stack>
            <Stack.Screen
                name="home"
                options={{
                    title: 'Casyomax Admin',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileButton}>
                            <Ionicons name="person-circle-outline" size={30} color="#4A90E2" />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen name="profile" options={{ title: 'Admin Profile', presentation: 'modal' }} />
        </Stack>
    );
}

const styles = StyleSheet.create({
    profileButton: {
        marginRight: 10,
    },
});
