import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { logoutUser } from '../../services/AuthService';
import { useTheme } from '../../theme/ThemeProvider';

const AdminProfileScreen = () => {
    const { colors, spacing, radius } = useTheme();
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (userDataStr) {
                setUser(JSON.parse(userDataStr));
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
    };

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Admin User';

    const InfoRow = ({ icon, label, value, last }) => (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
                borderBottomWidth: last ? 0 : 1,
                borderBottomColor: colors.border,
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <AppText variant="caption" color="textMuted">{label}</AppText>
                <AppText variant="bodyLg" weight="medium">{value}</AppText>
            </View>
        </View>
    );

    return (
        <Screen scroll edges={['left', 'right']}>
            <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl }}>
                <Avatar uri={user?.profile_image_url} name={fullName} size={104} />
                <AppText variant="titleLg" style={{ marginTop: spacing.lg }}>{fullName}</AppText>
                <Badge tone="primary" label={user?.role ? user.role.toUpperCase() : 'ADMINISTRATOR'} style={{ marginTop: spacing.sm }} />
            </View>

            <Card padded={false} style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
                <InfoRow icon="mail-outline" label="Email" value={user?.email || 'admin@casyomax.com'} />
                <InfoRow icon="shield-checkmark-outline" label="Access level" value="Full access" last />
            </Card>

            <Button title="Log out" icon="log-out-outline" variant="secondary" fullWidth onPress={handleLogout} />
        </Screen>
    );
};

export default AdminProfileScreen;
