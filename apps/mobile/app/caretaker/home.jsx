import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatientCard from '../../components/PatientCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { AppText } from '../../components/ui/AppText';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { useTheme } from '../../theme/ThemeProvider';

const greetingFor = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
};

const CaretakerHomeScreen = () => {
    const { colors, spacing, radius, fonts, shadows } = useTheme();
    const [patients, setPatients] = useState([]);
    const [user, setUser] = useState(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setError(null);
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setUser(userData);
                const response = await ApiHelper.get(`${ENDPOINTS.CAREGIVER.ASSIGNMENTS}/${userData.id}`);
                if (response && response.success) {
                    setPatients(response.patients);
                }
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to load patients. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handlePatientPress = (patient) => {
        router.push(`/caretaker/patient/${patient.patient_id}`);
    };

    const upcoming = useMemo(() => patients.filter((p) => p.next_medication).length, [patients]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter((p) => `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q));
    }, [patients, query]);

    const screenStyle = { flex: 1, backgroundColor: colors.background };

    const StatTile = ({ value, label, icon, tone = 'primary' }) => {
        const toneColor = tone === 'warning' ? colors.warning : colors.primary;
        const toneSoft = tone === 'warning' ? colors.warningSoft : colors.primarySoft;
        return (
            <Card elevation="sm" style={{ flex: 1 }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: toneSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: spacing.sm,
                    }}
                >
                    <Ionicons name={icon} size={18} color={toneColor} />
                </View>
                <AppText variant="displayLg">{value}</AppText>
                <AppText variant="caption" color="textMuted">{label}</AppText>
            </Card>
        );
    };

    const FixedHeader = () => (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            {/* Greeting + profile */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                    <AppText variant="body" color="textSecondary">{greetingFor()},</AppText>
                    <AppText variant="display" numberOfLines={1}>
                        {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Caretaker'}
                    </AppText>
                </View>
                <Pressable onPress={() => router.push('/caretaker/profile')} hitSlop={8}>
                    <Avatar
                        uri={user?.profile_image_url}
                        name={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Me'}
                        size={48}
                    />
                </Pressable>
            </View>

            {/* Stat tiles */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                <StatTile value={patients.length} label="Patients" icon="people-outline" />
                <StatTile value={upcoming} label="Upcoming doses" icon="time-outline" tone="warning" />
            </View>

            {/* Search */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.md,
                    height: 48,
                    marginTop: spacing.lg,
                    ...shadows.sm,
                }}
            >
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                    placeholder="Search patients"
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    style={{ flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 }}
                />
                {query.length > 0 ? (
                    <Pressable onPress={() => setQuery('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                ) : null}
            </View>

            <AppText variant="label" color="textSecondary" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
                {`YOUR PATIENTS${patients.length ? ` (${patients.length})` : ''}`}
            </AppText>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView edges={['top', 'left', 'right']} style={screenStyle}>
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
                    <SkeletonLoader width={150} height={16} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width={200} height={28} style={{ marginBottom: spacing.lg }} />
                    <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                        <SkeletonLoader width="48%" height={92} borderRadius={radius.lg} />
                        <SkeletonLoader width="48%" height={92} borderRadius={radius.lg} />
                    </View>
                    <SkeletonLoader width="100%" height={48} borderRadius={radius.lg} style={{ marginBottom: spacing.xl }} />
                    {[1, 2, 3].map((i) => (
                        <SkeletonLoader key={i} width="100%" height={92} borderRadius={radius.lg} style={{ marginBottom: spacing.md }} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView edges={['top', 'left', 'right']} style={screenStyle}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
                    <View
                        style={{
                            width: 88,
                            height: 88,
                            borderRadius: 44,
                            backgroundColor: colors.dangerSoft,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
                    </View>
                    <AppText variant="body" color="textSecondary" align="center">{error}</AppText>
                    <Button title="Try again" icon="refresh" onPress={fetchPatients} variant="secondary" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={screenStyle}>
            {FixedHeader()}
            <FlatList
                data={filtered}
                renderItem={({ item }) => (
                    <PatientCard patient={item} onPress={() => handlePatientPress(item)} />
                )}
                keyExtractor={(item) => item.patient_id.toString()}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchPatients} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>
                        <View
                            style={{
                                width: 96,
                                height: 96,
                                borderRadius: 48,
                                backgroundColor: colors.primarySoft,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: spacing.lg,
                            }}
                        >
                            <Ionicons name={query ? 'search-outline' : 'people-outline'} size={44} color={colors.primary} />
                        </View>
                        <AppText variant="title">{query ? 'No matches' : 'No patients yet'}</AppText>
                        <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: spacing.xs, maxWidth: 290 }}>
                            {query
                                ? `No patients match "${query}".`
                                : "You haven't been assigned to any patients. Contact your administrator to get started."}
                        </AppText>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default CaretakerHomeScreen;
