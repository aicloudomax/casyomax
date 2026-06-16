import { Stack, useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { useTheme } from '../../theme/ThemeProvider';

export default function AdminLayout() {
    const router = useRouter();
    const { colors, fonts } = useTheme();
    const [user, setUser] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const userDataStr = await SecureStore.getItemAsync('userData');
                if (userDataStr) setUser(JSON.parse(userDataStr));
            } catch (error) {
                console.log('Error fetching user data for layout:', error);
            }
        })();
    }, []);

    const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Admin';

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
                headerTintColor: colors.text,
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="home"
                options={{
                    title: 'Casyomax Admin',
                    headerRight: () => (
                        <Pressable onPress={() => router.push('/admin/profile')} hitSlop={8} style={{ marginRight: 12 }}>
                            <Avatar uri={user?.profile_image_url} name={name} size={34} />
                        </Pressable>
                    ),
                }}
            />
            <Stack.Screen name="profile" options={{ title: 'Admin Profile', presentation: 'modal' }} />
        </Stack>
    );
}
