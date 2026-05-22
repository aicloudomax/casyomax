import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

const MedicationCard = ({ medicationName, dosage, time, status, isActive, onVoiceDone, onAction }) => {
    const {
        isSpeaking,
        isListening,
        isProcessing,
        transcript,
        speak,
        startListening,
        stopListening,
        processCommand
    } = useVoiceAssistant();

    const timeoutRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        console.log("💊 MedicationCard Update. Status:", status, "isActive:", isActive);

        const runVoiceFlow = async () => {
            // Only speak if this card is explicitly active (Queue Logic)
            if (isActive && (!status || status === 'pending')) {
                console.log("🗣️ Triggering voice for:", medicationName);
                const textToSpeak = `It's time to take ${medicationName}. ${dosage}.`;

                // Wait a tiny bit for UI to settle
                await new Promise(resolve => setTimeout(resolve, 500));
                if (!isMounted) return;

                speak(textToSpeak, () => {
                    if (!isMounted) return;

                    // Auto-start listening after speaking
                    // Add small delay to ensure speaker is fully released
                    setTimeout(() => {
                        if (!isMounted) return;
                        startListening();
                    }, 500);

                    // Stop listening after 6 seconds if no input
                    timeoutRef.current = setTimeout(async () => {
                        if (!isMounted) return;

                        console.log("⏳ Voice timeout reached for:", medicationName);
                        // Stop listening and get result
                        const text = await stopListening();
                        console.log("🎤 Transcribed Text (Timeout):", text);

                        if (text && text.startsWith('Error:')) {
                            console.warn("Voice Error:", text);
                        } else if (text) {
                            const command = processCommand(text);
                            console.log(`Debug Voice: Heard "${text}" -> Command: ${command}`);

                            if (command) {
                                onAction(command);
                            }
                        } else {
                            console.log("Debug Voice: No speech detected.");
                        }

                        // Signal completion to parent so next card can start
                        // We do this regardless of success/fail to unblock the queue
                        if (onVoiceDone) {
                            console.log("✅ Signaling onVoiceDone for:", medicationName);
                            onVoiceDone();
                        }
                    }, 8000); // Increased to 8s to allow for user thinking time
                });
            }
        };

        runVoiceFlow();

        return () => {
            console.log("🧹 Cleanup for:", medicationName);
            isMounted = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            // Ensure we release the mic if the component loses focus or queue moves
            // This prevents "Only one Recording object" errors for the next card
            // We use a lingering stop in the hook, but calling it here is safe practice
            stopListening().catch(err => console.log("Cleanup stop error:", err));
        };
    }, [isActive]); // Re-run if active state changes

    const handleMicPress = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (isListening) {
            const text = await stopListening();
            console.log("🎤 Transcribed Text (Manual):", text);

            if (text) {
                const command = processCommand(text);
                Alert.alert("Debug Voice", `Heard: "${text}"\nCommand: ${command || 'None'}`);

                if (command) {
                    onAction(command);
                }
            }
        } else {
            startListening();
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'taken':
                return { icon: 'checkmark-circle', color: '#27AE60', bg: '#E8F5E9', text: 'Taken' };
            case 'missed':
                return { icon: 'close-circle', color: '#EB5757', bg: '#FFEBEE', text: 'Missed' };
            case 'snoozed':
                return { icon: 'time', color: '#F2994A', bg: '#FFF3E0', text: 'Snoozed' };
            default:
                return { icon: 'help-circle', color: '#999', bg: '#F5F5F5', text: status };
        }
    };

    const statusConfig = status && status !== 'pending' ? getStatusConfig(status) : null;

    return (
        <View style={styles.cardContainer}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={[styles.headerTitle, status === 'taken' && { color: '#27AE60' }]}>
                        {status === 'taken' ? "Medication Taken" : (status === 'missed' ? "Medication Missed" : "Time for your medicine!")}
                    </Text>
                    {(!status || status === 'pending') && (
                        <View style={styles.voiceStatus}>
                            {isSpeaking && <Ionicons name="volume-high" size={20} color="#2D9CDB" />}
                            {isListening && <ActivityIndicator size="small" color="#EB5757" />}
                            {isProcessing && <ActivityIndicator size="small" color="#F2994A" />}
                        </View>
                    )}
                </View>
                <Text style={styles.headerSubtitle}>
                    {status === 'taken'
                        ? "You have marked this medication as taken."
                        : "It's time to take the following medications. Please confirm each one."}
                </Text>
                {transcript ? <Text style={styles.transcriptText}>"{transcript}"</Text> : null}
            </View>

            <View style={styles.medicationRow}>
                <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>
                        {medicationName} <Text style={styles.dosage}>({dosage})</Text>
                    </Text>
                    <View style={styles.timeBadge}>
                        <Text style={styles.timeText}>{time}</Text>
                    </View>
                </View>

                {!status || status === 'pending' ? (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.takenButton]}
                            onPress={() => onAction('taken')}
                        >
                            <Ionicons name="thumbs-up-outline" size={18} color="#27AE60" />
                            <Text style={[styles.buttonText, styles.takenText]}>Yes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.missedButton]}
                            onPress={() => onAction('missed')}
                        >
                            <Ionicons name="thumbs-down-outline" size={18} color="#EB5757" />
                            <Text style={[styles.buttonText, styles.missedText]}>No</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.snoozeButton]}
                            onPress={() => onAction('snooze')}
                        >
                            <Ionicons name="time-outline" size={18} color="#333" />
                            <Text style={[styles.buttonText, styles.snoozeText]}>Later</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.micButton, isListening && styles.micButtonActive]}
                            onPress={handleMicPress}
                        >
                            <Ionicons name={isListening ? "mic" : "mic-outline"} size={20} color={isListening ? "#FFF" : "#333"} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.statusContainer, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.text}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    medicationRow: {
        backgroundColor: '#F0F4F8', // Light blue-gray
        borderRadius: 8,
        padding: 16,
    },
    medicationInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    medicationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    dosage: {
        fontWeight: 'normal',
        color: '#555',
    },
    timeBadge: {
        backgroundColor: '#E1E4E8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    timeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
    },
    buttonText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    takenButton: {
        borderColor: '#27AE60',
        backgroundColor: '#F0F9F4',
    },
    takenText: {
        color: '#27AE60',
    },
    missedButton: {
        borderColor: '#EB5757',
        backgroundColor: '#FEF2F2',
    },
    missedText: {
        color: '#EB5757',
    },
    snoozeButton: {
        borderColor: '#E1E4E8',
        backgroundColor: '#FFF',
    },
    snoozeText: {
        color: '#333',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    voiceStatus: {
        flexDirection: 'row',
        gap: 8,
    },
    transcriptText: {
        fontSize: 12,
        color: '#2D9CDB',
        fontStyle: 'italic',
        marginTop: 4,
    },
    micButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        backgroundColor: '#FFF',
    },
    micButtonActive: {
        backgroundColor: '#EB5757',
        borderColor: '#EB5757',
    },
});

export default MedicationCard;
