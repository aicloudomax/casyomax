import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { Alert } from '@/services/CrossPlatformAlert';
import { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
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

const PatientProfileScreen = () => {
    const { colors, spacing, radius, fonts } = useTheme();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [deleting, setDeleting] = useState(false);

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

    const confirmDelete = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter your password.');
            return;
        }
        setDeleting(true);
        const result = await deleteAccount(password);
        setDeleting(false);
        setModalVisible(false);
        setPassword('');
        if (!result.success) {
            Alert.alert('Error', result.message);
        }
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
            <View style={iconCircle}>
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <AppText variant="caption" color="textMuted">{label}</AppText>
                <AppText variant="bodyLg" weight="medium">{value || 'N/A'}</AppText>
            </View>
        </View>
    );

    const ActionRow = ({ icon, label, onPress }) => (
        <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={iconCircle}>
                    <Ionicons name={icon} size={18} color={colors.primary} />
                </View>
                <AppText variant="subtitle" style={{ flex: 1 }}>{label}</AppText>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
        </Card>
    );

    const iconCircle = {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    };

    if (loading) {
        return (
            <Screen scroll edges={['left', 'right']}>
                <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl }}>
                    <SkeletonLoader width={104} height={104} borderRadius={52} style={{ marginBottom: spacing.lg }} />
                    <SkeletonLoader width={160} height={24} style={{ marginBottom: spacing.sm }} />
                    <SkeletonLoader width={90} height={16} />
                </View>
                <SkeletonLoader width="100%" height={140} borderRadius={radius.lg} style={{ marginBottom: spacing.lg }} />
                <SkeletonLoader width="100%" height={64} borderRadius={radius.lg} style={{ marginBottom: spacing.md }} />
                <SkeletonLoader width="100%" height={64} borderRadius={radius.lg} />
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

            <ActionRow icon="time-outline" label="Medication History" onPress={() => router.push('/patient/medication-history')} />
            <ActionRow icon="people-outline" label="My Contacts" onPress={() => router.push('/patient/contacts')} />

            <View style={{ marginTop: spacing.md }}>
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
                    onPress={() => setModalVisible(true)}
                    style={{ borderWidth: 1, borderColor: colors.danger }}
                />
            </View>

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl }}>
                    <Card elevation="lg">
                        <AppText variant="title" align="center">Delete account</AppText>
                        <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: spacing.sm }}>
                            This cannot be undone. Enter your password to confirm.
                        </AppText>
                        <TextInput
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor={colors.textMuted}
                            style={{
                                backgroundColor: colors.surfaceSunken,
                                borderRadius: radius.md,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: spacing.md,
                                marginTop: spacing.lg,
                                marginBottom: spacing.lg,
                                color: colors.text,
                                fontFamily: fonts.regular,
                                fontSize: 16,
                            }}
                        />
                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => { setModalVisible(false); setPassword(''); }}
                                style={{ flex: 1, justifyContent: 'center' }}
                            />
                            <Button
                                title={deleting ? 'Deleting…' : 'Delete'}
                                variant="danger"
                                loading={deleting}
                                onPress={confirmDelete}
                                style={{ flex: 1, justifyContent: 'center' }}
                            />
                        </View>
                    </Card>
                </View>
            </Modal>
        </Screen>
    );
};

export default PatientProfileScreen;
