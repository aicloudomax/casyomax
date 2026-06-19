import { Stack } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import MedicationManager from '../../components/MedicationManager';
import { ENDPOINTS } from '../../constants/ApiConstants';
import ApiHelper from '../../services/ApiHelper';
import { useTheme } from '../../theme/ThemeProvider';

export default function PatientMedicationsScreen() {
    const { colors } = useTheme();
    const [patientId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPatientId();
    }, []);

    const fetchPatientId = async (attempt = 0) => {
        const MAX_ATTEMPTS = 4;
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (!userDataStr) { setLoading(false); return; }
            const user = JSON.parse(userDataStr);
            const response = await ApiHelper.get(`${ENDPOINTS.PATIENTS}/user/${user.id}`);
            if (response.success && response.patient) {
                setPatientId(response.patient.patient_id);
                setLoading(false);
                return;
            }
            throw new Error('Profile response was not successful');
        } catch (error) {
            if (attempt < MAX_ATTEMPTS) {
                setTimeout(() => fetchPatientId(attempt + 1), 1000 * (attempt + 1));
            } else {
                console.error("Could not load patient profile after retries:", error?.message);
                setLoading(false);
            }
        }
    };

    if (loading || !patientId) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <MedicationManager patientId={patientId} title="My Medications" restrictToOwn />
        </>
    );
}
