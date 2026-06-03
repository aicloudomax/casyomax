import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../../hooks/usePlan';

/**
 * Plan information screen for patients.
 */
export default function PlanScreen() {
    const { plan, getRemainingUsage } = usePlan();

    const features = [
        { name: "AI Health Assistant", free: "10 chats / day", premium: "Unlimited" },
        { name: "Voice Commands", free: "5 chats / day", premium: "Unlimited" },
        { name: "Email Sending", free: "❌ Blocked", premium: "✅ Included" },
        { name: "Email Scheduling", free: "❌ Blocked", premium: "✅ Included" },
        { name: "Caretaker Collaboration", free: "✅ Included", premium: "✅ Included" },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Current Plan Header */}
            <View style={styles.header}>
                <Ionicons
                    name={plan === 'premium' ? "star" : "person"}
                    size={60}
                    color={plan === 'premium' ? "#FFD700" : "#4A90E2"}
                />
                <Text style={styles.planTitle}>Current Plan: {plan.toUpperCase()}</Text>
                <Text style={styles.planSub}>
                    {plan === 'free'
                        ? "You are using the basic version of CareSync."
                        : "You have full access to all CareSync features."}
                </Text>
            </View>

            {/* Feature Comparison */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Feature Comparison</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { flex: 2 }]}>Feature</Text>
                        <Text style={styles.headerCell}>Free</Text>
                        <Text style={styles.headerCell}>Premium</Text>
                    </View>
                    {features.map((f, i) => (
                        <View key={i} style={[styles.tableRow, i === features.length - 1 && { borderBottomWidth: 0 }]}>
                            <Text style={[styles.cell, { flex: 2, fontWeight: '600' }]}>{f.name}</Text>
                            <Text style={styles.cell}>{f.free}</Text>
                            <Text style={[styles.cell, { color: '#4CAF50', fontWeight: 'bold' }]}>{f.premium}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Premium availability note */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Premium</Text>
                    <Text style={styles.infoText}>
                        Premium features are coming soon.
                    </Text>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
    },
    planTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 15,
        color: '#333',
    },
    planSub: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    table: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F0F2F5',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
    },
    headerCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
        alignItems: 'center',
    },
    cell: {
        flex: 1,
        fontSize: 11,
        color: '#444',
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EBF4FF',
        margin: 20,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C5282',
    },
    infoText: {
        fontSize: 12,
        color: '#2C5282',
        lineHeight: 18,
    }
});
