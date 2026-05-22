import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Component to wrap premium features.
 * Shows a lock overlay for free-tier users.
 */
export const FeatureGate = ({ children, feature, plan, message }) => {
    // Premium users always see the content
    if (plan === 'premium') {
        return children;
    }

    // Default message for generic locks
    const displayMessage = message || "This is a Premium feature";

    return (
        <View style={styles.container}>
            {/* The actual component is blurred/dimmed in the background */}
            <View style={styles.contentDimmed} pointerEvents="none">
                {children}
            </View>

            {/* Lock Overlay */}
            <View style={styles.overlay}>
                <Ionicons name="lock-closed" size={24} color="#FFF" />
                <Text style={styles.lockText}>{displayMessage}</Text>
                <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => router.push('/(patient)/plan')}
                >
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    contentDimmed: {
        opacity: 0.3,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
    },
    lockText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    upgradeButton: {
        marginTop: 12,
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    upgradeButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
