import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import EmptyStateCard from '../../components/EmptyStateCard';
import PatientCard from '../../components/PatientCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';

const CaretakerHomeScreen = () => {
    const [patients, setPatients] = useState([]);
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
                const response = await ApiHelper.get(`${ENDPOINTS.CAREGIVER.ASSIGNMENTS}/${userData.id}`);
                if (response && response.success) {
                    setPatients(response.patients);
                }
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
            setError("Failed to load patients. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handlePatientPress = (patient) => {
        // Navigate to patient details
        console.log("Pressed patient:", patient.first_name);
        router.push(`/caretaker/patient/${patient.patient_id}`);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <SkeletonLoader width={150} height={30} />
                    <SkeletonLoader width={80} height={30} borderRadius={20} />
                </View>
                <View style={styles.list}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ marginBottom: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <SkeletonLoader width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
                                <View>
                                    <SkeletonLoader width={120} height={20} style={{ marginBottom: 8 }} />
                                    <SkeletonLoader width={80} height={16} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryText} onPress={fetchPatients}>Tap to Retry</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>My Patients</Text>
                {patients.length > 0 && (
                    <View style={styles.countChip}>
                        <Text style={styles.countText}>{patients.length} Total</Text>
                    </View>
                )}
            </View>
            {patients.length === 0 ? (
                <EmptyStateCard
                    iconName="lock-closed-outline"
                    message="Access Pending"
                    subMessage="You haven't been assigned to any patients yet. Please contact your administrator to get started."
                />
            ) : (

                <FlatList
                    data={patients}
                    renderItem={({ item }) => (
                        <PatientCard
                            patient={item}
                            onPress={() => handlePatientPress(item)}
                        />
                    )}
                    keyExtractor={(item) => item.patient_id.toString()}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchPatients}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    countChip: {
        backgroundColor: '#E1E4E8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    countText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    list: {
        paddingBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#EB5757',
        marginBottom: 12,
        textAlign: 'center',
    },
    retryText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
});

export default CaretakerHomeScreen;
