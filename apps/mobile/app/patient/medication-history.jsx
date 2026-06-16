import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import SkeletonLoader from '../../components/SkeletonLoader';
import { AppText } from '../../components/ui/AppText';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { useTheme } from '../../theme/ThemeProvider';

const MedicationHistoryScreen = () => {
    const { colors, spacing, radius } = useTheme();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await ApiHelper.get(ENDPOINTS.NOTIFICATIONS.HISTORY);
            if (response.data && response.success) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusMeta = (status) => {
        switch (status) {
            case 'taken':
                return { tone: 'success', icon: 'checkmark-circle', color: colors.success };
            case 'missed':
                return { tone: 'danger', icon: 'close-circle', color: colors.danger };
            case 'snoozed':
                return { tone: 'warning', icon: 'time', color: colors.warning };
            default:
                return { tone: 'neutral', icon: 'ellipse', color: colors.textMuted };
        }
    };

    const renderHistoryItem = ({ item }) => {
        const meta = statusMeta(item.status);
        return (
            <Card style={{ marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: meta.color }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <Ionicons name={meta.icon} size={24} color={meta.color} />
                        <View style={{ flex: 1 }}>
                            <AppText variant="subtitle" numberOfLines={1}>{item.medicine_name}</AppText>
                            <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                                {`${item.dosage || ''}${item.dosage ? ' · ' : ''}${new Date(item.scheduled_at).toLocaleString()}`}
                            </AppText>
                        </View>
                    </View>
                    <Badge tone={meta.tone} label={(item.status || '').toUpperCase()} />
                </View>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ title: 'Medication History', headerBackTitle: 'Back' }} />

            {loading ? (
                <View style={{ padding: spacing.lg }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonLoader
                            key={i}
                            width="100%"
                            height={76}
                            borderRadius={radius.lg}
                            style={{ marginBottom: spacing.md }}
                        />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: spacing.xxxl, paddingHorizontal: spacing.xl }}>
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
                                <Ionicons name="document-text-outline" size={44} color={colors.primary} />
                            </View>
                            <AppText variant="title">No history yet</AppText>
                            <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: spacing.xs, maxWidth: 280 }}>
                                Your medication activity will appear here once doses are logged.
                            </AppText>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default MedicationHistoryScreen;
