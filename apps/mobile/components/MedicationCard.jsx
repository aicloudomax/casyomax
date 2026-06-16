import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/services/CrossPlatformAlert';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

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

    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

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
                return { icon: 'checkmark-circle', tone: 'success', text: 'Taken' };
            case 'missed':
                return { icon: 'close-circle', tone: 'danger', text: 'Missed' };
            case 'snoozed':
                return { icon: 'time', tone: 'warning', text: 'Snoozed' };
            default:
                return { icon: 'help-circle', tone: 'neutral', text: status };
        }
    };

    const statusConfig = status && status !== 'pending' ? getStatusConfig(status) : null;

    return (
        <Card padded={false} elevation="sm" style={styles.cardContainer}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <AppText
                        variant="subtitle"
                        weight="bold"
                        color={status === 'taken' ? 'success' : 'text'}
                        style={styles.headerTitle}
                    >
                        {status === 'taken' ? "Medication Taken" : (status === 'missed' ? "Medication Missed" : "Time for your medicine!")}
                    </AppText>
                    {(!status || status === 'pending') && (
                        <View style={styles.voiceStatus}>
                            {isSpeaking && <Ionicons name="volume-high" size={20} color={colors.primary} />}
                            {isListening && <ActivityIndicator size="small" color={colors.danger} />}
                            {isProcessing && <ActivityIndicator size="small" color={colors.warning} />}
                        </View>
                    )}
                </View>
                <AppText variant="body" color="textSecondary" style={styles.headerSubtitle}>
                    {status === 'taken'
                        ? "You have marked this medication as taken."
                        : "It's time to take the following medications. Please confirm each one."}
                </AppText>
                {transcript ? <AppText variant="caption" color="primary" style={styles.transcriptText}>"{transcript}"</AppText> : null}
            </View>

            <View style={styles.medicationRow}>
                <View style={styles.medicationInfo}>
                    <AppText variant="subtitle" weight="bold" style={styles.medicationName}>
                        {medicationName} <AppText variant="subtitle" weight="regular" color="textSecondary">({dosage})</AppText>
                    </AppText>
                    <View style={styles.timeBadge}>
                        <AppText variant="caption" weight="bold" color="textSecondary">{time}</AppText>
                    </View>
                </View>

                {!status || status === 'pending' ? (
                    <View style={styles.actionButtons}>
                        <Button
                            title="Yes"
                            icon="thumbs-up-outline"
                            variant="secondary"
                            size="sm"
                            color={colors.success}
                            onPress={() => onAction('taken')}
                            style={styles.flexBtn}
                        />
                        <Button
                            title="No"
                            icon="thumbs-down-outline"
                            variant="secondary"
                            size="sm"
                            color={colors.danger}
                            onPress={() => onAction('missed')}
                            style={styles.flexBtn}
                        />
                        <Button
                            title="Later"
                            icon="time-outline"
                            variant="secondary"
                            size="sm"
                            color={colors.textSecondary}
                            onPress={() => onAction('snooze')}
                            style={styles.flexBtn}
                        />

                        <TouchableOpacity
                            style={[styles.micButton, isListening && styles.micButtonActive]}
                            onPress={handleMicPress}
                        >
                            <Ionicons name={isListening ? "mic" : "mic-outline"} size={20} color={isListening ? "#FFF" : colors.text} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Badge label={statusConfig.text} tone={statusConfig.tone} dot />
                )}
            </View>
        </Card>
    );
};

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    const f = t.fonts;
    const sh = t.shadows;
    return StyleSheet.create({
        cardContainer: {
            padding: 16,
            marginBottom: 16,
            width: '100%',
        },
        header: {
            marginBottom: 16,
        },
        headerTitle: {
            marginBottom: 4,
        },
        headerSubtitle: {
            lineHeight: 20,
        },
        medicationRow: {
            backgroundColor: c.surfaceAlt,
            borderRadius: r.md,
            padding: 16,
        },
        medicationInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        medicationName: {
            color: c.text,
            flexShrink: 1,
        },
        timeBadge: {
            backgroundColor: c.surfaceSunken,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: r.sm,
            borderWidth: 1,
            borderColor: c.border,
        },
        actionButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
        },
        flexBtn: {
            flex: 1,
            alignSelf: 'stretch',
        },
        transcriptText: {
            fontStyle: 'italic',
            marginTop: 4,
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
        micButton: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            borderRadius: r.md,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
        },
        micButtonActive: {
            backgroundColor: c.danger,
            borderColor: c.danger,
        },
    });
};

export default MedicationCard;
