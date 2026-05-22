import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const EmptyStateCard = ({ iconName, message, subMessage }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={80} color="#A0C4E8" />
            </View>
            <Text style={styles.message}>{message}</Text>
            {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#FFF',
        borderRadius: 16,
        margin: 16,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderStyle: 'dashed',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F7FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    message: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    subMessage: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
});

export default EmptyStateCard;
