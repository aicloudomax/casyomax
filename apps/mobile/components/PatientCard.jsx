import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PatientCard = ({ patient, onPress }) => {
    console.log("Patient", patient);
    // Calculate age from DOB
    const getAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Image
                    source={{ uri: 'https://i.pravatar.cc/150?u=' + patient.patient_id }} // Placeholder avatar
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{patient.first_name} {patient.last_name}</Text>
                    <Text style={styles.age}>Age: {getAge(patient.date_of_birth)}</Text>
                </View>
            </View>

            <Text style={styles.medicationText}>
                Next medication at {patient.next_medication || 'No upcoming meds'}.
            </Text>

            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Text style={styles.buttonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#E1E4E8',
    },
    info: {
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    age: {
        fontSize: 14,
        color: '#666',
    },
    medicationText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#F0F4F8',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginRight: 8,
    },
});

export default PatientCard;
