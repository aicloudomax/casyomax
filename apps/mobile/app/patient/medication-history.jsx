import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import EmptyStateCard from '../../components/EmptyStateCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';

const MedicationHistoryScreen = () => {
    const router = useRouter();
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
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderHistoryItem = ({ item }) => {
        let statusColor = '#999';
        if (item.status === 'taken') statusColor = '#27AE60';
        if (item.status === 'missed') statusColor = '#EB5757';
        if (item.status === 'snoozed') statusColor = '#F2994A';

        return (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
                <View style={styles.cardRow}>
                    <View style={styles.info}>
                        <Text style={styles.medName}>{item.medicine_name}</Text>
                        <Text style={styles.subText}>
                            {item.dosage} • {new Date(item.scheduled_at).toLocaleString()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Medication History', headerBackTitle: 'Back' }} />

            {loading ? (
                <View style={styles.list}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={{ marginBottom: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View>
                                    <SkeletonLoader width={120} height={20} style={{ marginBottom: 8 }} />
                                    <SkeletonLoader width={150} height={16} />
                                </View>
                                <SkeletonLoader width={60} height={24} borderRadius={6} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderHistoryItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <EmptyStateCard
                            iconName="document-text-outline"
                            message="No History"
                            subMessage="You haven't taken any medications yet."
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flex: 1,
    },
    medName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    subText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#888',
    },
});

export default MedicationHistoryScreen;
