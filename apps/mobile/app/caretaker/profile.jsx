import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from '@/services/SecureStore';
import { Alert } from '@/services/CrossPlatformAlert';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import SkeletonLoader from '../../components/SkeletonLoader';
import { AppText } from '../../components/ui/AppText';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { deleteAccount, logoutUser } from '../../services/AuthService';
import { useTheme } from '../../theme/ThemeProvider';

const roleLabel = (role) => {
    if (!role) return 'User';
    if (role === 'caregiver') return 'Caretaker';
    return role.charAt(0).toUpperCase() + role.slice(1);
};

const CaretakerProfileScreen = () => {
    const { colors, spacing, radius } = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                const response = await ApiHelper.get(`${ENDPOINTS.USERS}/${userData.id}`);
                if (response.success) {
                    setUser(response.user);
                    await SecureStore.setItemAsync('userData', JSON.stringify(response.user));
                } else {
                    setUser(userData);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        const result = await deleteAccount();
                        setLoading(false);
                        if (!result.success) {
                            Alert.alert('Error', result.message);
                        }
                    },
                },
            ]
        );
    };

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
                <AppText variant="bodyLg" weight="medium">{value || 'N/A'}</AppText>
            </View>
        </View>
    );

    if (loading) {
        return (
            <Screen scroll edges={['left', 'right']}>
                <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl }}>
                    <SkeletonLoader width={104} height={104} borderRadius={52} style={{ marginBottom: spacing.lg }} />
                    <SkeletonLoader width={160} height={24} style={{ marginBottom: spacing.sm }} />
                    <SkeletonLoader width={90} height={16} />
                </View>
                <SkeletonLoader width="100%" height={140} borderRadius={radius.lg} />
            </Screen>
        );
    }

    if (!user) {
        return (
            <Screen edges={['left', 'right']}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="body" color="textSecondary">No user data found.</AppText>
                </View>
            </Screen>
        );
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    return (
        <Screen scroll edges={['left', 'right']}>
            <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl }}>
                <Avatar uri={user.profile_image_url} name={fullName} size={104} />
                <AppText variant="titleLg" style={{ marginTop: spacing.lg }}>{fullName}</AppText>
                <Badge tone="primary" label={roleLabel(user.role)} style={{ marginTop: spacing.sm }} />
            </View>

            <Card padded={false} style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
                <InfoRow icon="mail-outline" label="Email" value={user.email} />
                <InfoRow icon="call-outline" label="Phone" value={user.phone} last />
            </Card>

            <Button
                title="Log out"
                icon="log-out-outline"
                variant="secondary"
                fullWidth
                onPress={handleLogout}
                style={{ marginBottom: spacing.md }}
            />
            <Button
                title="Delete account"
                icon="trash-outline"
                variant="ghost"
                color={colors.danger}
                fullWidth
                onPress={handleDeleteAccount}
                style={{ borderWidth: 1, borderColor: colors.danger }}
            />
        </Screen>
    );
};

export default CaretakerProfileScreen;
