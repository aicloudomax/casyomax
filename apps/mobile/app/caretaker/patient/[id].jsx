import { Stack, useLocalSearchParams } from 'expo-router';
import MedicationManager from '../../../components/MedicationManager';

export default function PatientDetailsScreen() {
    const { id } = useLocalSearchParams();
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <MedicationManager patientId={id} />
        </>
    );
}
