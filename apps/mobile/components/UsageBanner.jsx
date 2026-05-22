import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Banner showing daily usage limits at the top of feature screens.
 */
export const UsageBanner = ({ feature, remaining, plan }) => {
    if (plan === 'premium') return null;

    const limits = {
        ai_chat: 10,
        voice_chat: 5
    };

    const limit = limits[feature] || 0;
    const used = limit - remaining;

    // Determine colors
    let color = '#4CAF50'; // Green
    if (remaining <= 0) color = '#F44336'; // Red
    else if (remaining <= 3) color = '#FFC107'; // Yellow

    return (
        <View style={[styles.container, { backgroundColor: color + '20', borderColor: color }]}>
            <Ionicons name="information-circle-outline" size={18} color={color} />
            <Text style={[styles.text, { color }]}>
                {remaining > 0
                    ? `Usage today: ${used} / ${limit} ${feature === 'ai_chat' ? 'chats' : 'voice chats'}`
                    : `Daily limit reached (${limit}/${limit})`
                }
            </Text>
            {remaining > 0 && remaining <= 3 && (
                <Text style={styles.warningText}> Low remaining!</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
    warningText: {
        fontSize: 11,
        color: '#FFC107',
        fontStyle: 'italic',
    }
});
