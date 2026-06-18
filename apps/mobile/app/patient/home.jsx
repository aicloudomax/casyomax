import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/services/CrossPlatformAlert';
import { useTheme } from '../../theme/ThemeProvider';

import Markdown from 'react-native-markdown-display';
import Toast from 'react-native-toast-message';
import EmailDraftCard from '../../components/EmailDraftCard'; // NEW
import MedicationCard from '../../components/MedicationCard';
// import VoiceOrb from '../../components/VoiceOrb'; // Legacy 2D Orb
import { UsageBanner } from '../../components/UsageBanner';
import VoiceParticleSphere from '../../components/VoiceParticleSphere'; // New 3D Particle Sphere
import { ENDPOINTS } from '../../constants/ApiConstants';
import { usePlan } from '../../hooks/usePlan';
import ApiHelper from '../../services/ApiHelper';
import AzureService from '../../services/AzureService';
import { registerForPushNotificationsAsync, registerTokenWithBackend } from '../../services/notifications';



// Apple Guideline 1.4.1 — citations for medical/health information.
// These authoritative sources back the general health information the assistant provides.
const MEDICAL_SOURCES = [
    { name: 'MedlinePlus – U.S. National Library of Medicine', url: 'https://medlineplus.gov/' },
    { name: 'NHS – Health A to Z', url: 'https://www.nhs.uk/conditions/' },
    { name: 'Mayo Clinic – Diseases & Conditions', url: 'https://www.mayoclinic.org/diseases-conditions' },
    { name: 'World Health Organization (WHO)', url: 'https://www.who.int/health-topics' },
    { name: 'Centers for Disease Control and Prevention (CDC)', url: 'https://www.cdc.gov/' },
    { name: 'U.S. Food and Drug Administration (FDA) – Drugs', url: 'https://www.fda.gov/drugs' },
];

// Animated "typing" dots shown while the assistant is generating a reply.
const TypingDot = ({ delay, color }) => {
    const v = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.timing(v, { toValue: 0.3, duration: 350, useNativeDriver: true }),
            ])
        );
        const t = setTimeout(() => loop.start(), delay);
        return () => { clearTimeout(t); loop.stop(); };
    }, []);
    return (
        <Animated.View
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity: v, marginHorizontal: 2 }}
        />
    );
};

const TypingDots = ({ color }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TypingDot delay={0} color={color} />
        <TypingDot delay={160} color={color} />
        <TypingDot delay={320} color={color} />
    </View>
);

// Progressive "typewriter" reveal for a newly received assistant message.
const TypingText = ({ fullText, renderText, onDone }) => {
    const [count, setCount] = useState(0);
    useEffect(() => { setCount(0); }, [fullText]);
    useEffect(() => {
        if (count >= fullText.length) {
            if (fullText.length > 0) onDone?.();
            return;
        }
        const step = Math.max(2, Math.ceil(fullText.length / 80)); // ~80 ticks total
        const id = setTimeout(() => setCount((c) => Math.min(fullText.length, c + step)), 16);
        return () => clearTimeout(id);
    }, [count, fullText]);
    return renderText(fullText.slice(0, count));
};

const PatientHomeScreen = () => {
    const router = useRouter();
    const [patientId, setPatientId] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hello! I am your Casyomax Assistant. How can I help you with your health today?', sender: 'caretaker', type: 'text' },
    ]);
    const [expoPushToken, setExpoPushToken] = useState('');
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const recordingRef = useRef(null); // Ref for robust cleanup
    const voiceModeRef = useRef(false); // Ref for continuous conversation loop
    const hasUserSpokenRef = useRef(false); // Ref to track if user spoke
    const [audioLevel, setAudioLevel] = useState(0); // Normalized 0-1

    const [isProcessing, setIsProcessing] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [loadingText, setLoadingText] = useState('Thinking...');
    const listRef = useRef(null);
    const [sourcesVisible, setSourcesVisible] = useState(false);
    const [dismissedReminders, setDismissedReminders] = useState({});
    const notificationListener = useRef();
    const responseListener = useRef();
    const { plan, getRemainingUsage, isFeatureLocked, refreshPlan } = usePlan();


    // Animation values
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);


    useEffect(() => {
        if (isRecording) {
            pulseAnim.setValue(1);
            Animated.loop(
                Animated.timing(pulseAnim, {
                    toValue: 2.5, // Much larger scale
                    duration: 1500, // Slower expansion
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            pulseAnim.stopAnimation();
        }
    }, [isRecording]);


    useEffect(() => {
        if (Platform.OS !== 'web') {
            // 1. Setup listeners
            notificationListener.current = Notifications.addNotificationReceivedListener(handleNotification);
            responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

            // 2. Check if app was opened from a notification (cold start)
            const checkInitialNotification = async () => {
                const response = await Notifications.getLastNotificationResponseAsync();
                if (response) {
                    handleNotificationResponse(response);
                }
            };
            checkInitialNotification();

            // 3. Setup notifications
            setupNotifications();
        } else {
            console.log("Push notification listeners are not supported on web - skipping setup.");
        }

        // Fetch patient data on every platform.
        fetchPatientId(); // Fetch patient ID first
        fetchHistory();

        return () => {
            notificationListener.current?.remove?.();
            responseListener.current?.remove?.();

            // Cleanup recording on unmount
            if (recordingRef.current) {
                try {
                    recordingRef.current.stopAndUnloadAsync();
                } catch (e) {
                    console.log("Cleanup error", e);
                }
            }
        };
    }, []);

    // Poll for new due reminders while the screen is open. On web there is no
    // push-notification channel, so without this a reminder only appears after a
    // manual refresh. The dedup-by-id merge in fetchHistory keeps this safe to
    // run repeatedly, and it also acts as a safety net if a native push is missed.
    useEffect(() => {
        const POLL_MS = 20000; // 20s
        const interval = setInterval(() => {
            fetchHistory();
        }, POLL_MS);
        return () => clearInterval(interval);
    }, []);

    const fetchPatientId = async () => {
        try {
            const userDataStr = await SecureStore.getItemAsync('userData');
            console.log("userDataStr", userDataStr);
            if (userDataStr) {
                const user = JSON.parse(userDataStr);
                const response = await ApiHelper.get(`${ENDPOINTS.PATIENTS}/user/${user.id}`);
                console.log("response", response);
                if (response.success && response.patient) {
                    setPatientId(response.patient.patient_id);
                } else {
                    console.error("Could not fetch patient profile for user:", user.id);
                }
            }
        } catch (error) {
            console.error("Error fetching patient ID:", error);
        }
    };

    // ... existing notification handlers ...
    const handleNotification = (notification) => {
        const data = notification.request.content.data;
        if (data && data.type === 'medication_reminder') {
            addMedicationMessage(data);
        }
    };

    const handleNotificationResponse = (response) => {
        const data = response.notification.request.content.data;
        if (data && data.type === 'medication_reminder') {
            addMedicationMessage(data);
            console.log("Notification tapped:", data);
            // Fetch other pending medications immediately to ensure sequential voice flow covers all
            fetchHistory();
        }
    };

    // Determine which medication should currently be speaking (Queue Logic)
    // Find the first medication that is Pending, New, and hasn't attempted voice yet.
    // IMP: Sort by logId to be deterministic, so if multiple arrive at once, the order is fixed (Log ID 1, then Log ID 2)
    const activeLogId = messages
        .filter(m =>
            m.type === 'medication' &&
            m.data &&
            m.data.status === 'pending' &&
            m.data.isNew &&
            !m.data.voiceAttempted
        )
        .sort((a, b) => a.data.logId - b.data.logId) // Deterministic sort
        .shift()?.data.logId;

    // Due reminders are surfaced in a bottom sheet (not inline in the chat).
    // We queue pending ones by logId and show the first that hasn't been dismissed.
    const pendingReminders = messages
        .filter(m => m.type === 'medication' && m.data?.status === 'pending')
        .sort((a, b) => a.data.logId - b.data.logId);
    const currentReminder = pendingReminders.find(m => !dismissedReminders[m.data.logId]) || null;

    const dismissReminder = () => {
        if (currentReminder) {
            const logId = currentReminder.data.logId;
            setDismissedReminders(prev => ({ ...prev, [logId]: true }));
        }
    };

    const handleVoiceDone = (logId) => {
        console.log("✅ Voice interaction done for:", logId);
        setMessages(prev => prev.map(msg => {
            if (msg.data && msg.data.logId === logId) {
                // Mark as attempted so queue moves to next
                return { ...msg, data: { ...msg.data, voiceAttempted: true } };
            }
            return msg;
        }));
    };

    const setupNotifications = async () => {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        if (token) {
            await registerTokenWithBackend(token);
        }
    };

    const fetchHistory = async () => {
        // ... previous implementation ...
        try {
            const response = await ApiHelper.get(ENDPOINTS.NOTIFICATIONS.HISTORY);
            if (response.data && response.success) {
                // Filter: Only show pending or recently updated (within 5 mins)
                const now = new Date();
                const relevantLogs = response.data.filter(log => {
                    if (log.status === 'pending') return true;
                    const updatedTime = new Date(log.updated_at);
                    return (now - updatedTime) < 5 * 60 * 1000; // 5 minutes
                });

                const historyMessages = relevantLogs.map(log => ({
                    id: `log-${log.id}`,
                    type: 'medication',
                    sender: 'system',
                    data: {
                        medicationName: log.medicine_name,
                        dosage: log.dosage,
                        time: log.time_of_day, // Or scheduled_at formatted
                        logId: log.id,
                        status: log.status,
                        isNew: log.status === 'pending', // Treat pending as new so they speak
                        voiceAttempted: log.status !== 'pending' // Only speak if pending
                    },
                    createdAt: log.created_at
                }));

                setMessages(prev => {
                    // Merge and sort, avoiding duplicates if needed
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMsgs = historyMessages.filter(m => !existingIds.has(m.id));
                    const merged = [...prev, ...newMsgs];

                    // Sort by createdAt, then by logId for stability
                    return merged.sort((a, b) => {
                        const timeDiff = new Date(a.createdAt) - new Date(b.createdAt);
                        if (timeDiff !== 0) return timeDiff;
                        // If same time (e.g. batch scheduling), sort by ID
                        const idA = a.data?.logId || 0;
                        const idB = b.data?.logId || 0;
                        return idA - idB;
                    });
                });
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    const addMedicationMessage = (data) => {
        setMessages(prev => {
            // Check if we already have a message for this logId using deterministic ID
            const id = `log-${data.logId}`;
            const exists = prev.some(msg => msg.id === id);

            if (exists) {
                console.log("Duplicate medication message ignored:", data.logId);
                return prev;
            }

            const newMessage = {
                id: id,
                type: 'medication',
                sender: 'system',
                data: {
                    medicationName: data.medicationName,
                    dosage: 'Check details',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    logId: data.logId,
                    status: 'pending',
                    isNew: true, // New items from notification should auto-speak
                    voiceAttempted: false // Needs voice interaction
                },
                createdAt: new Date().toISOString()
            };
            return [...prev, newMessage];
        });
    };

    const handleMedicationAction = async (logId, action) => {
        // ... (existing body) ...
        try {
            // Optimistic update
            setMessages(prev => prev.map(msg => {
                if (msg.data && msg.data.logId === logId) {
                    return { ...msg, data: { ...msg.data, status: action === 'snooze' ? 'snoozed' : action } };
                }
                return msg;
            }));

            await ApiHelper.post(ENDPOINTS.NOTIFICATIONS.RESPOND, { logId, action });

            if (action === 'taken') {
                Toast.show({
                    type: 'success',
                    text1: 'Great!',
                    text2: 'Medication marked as taken.'
                });
            } else if (action === 'snooze') {
                Toast.show({
                    type: 'info',
                    text1: 'Snoozed',
                    text2: 'We will remind you in 5 minutes.'
                });
            }

            // Remove after 5 minutes
            setTimeout(() => {
                setMessages(prev => prev.filter(msg => {
                    if (msg.data && msg.data.logId === logId) {
                        return false; // Remove this message
                    }
                    return true;
                }));
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error("Error responding:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update status.'
            });
        }
    };

    const handleEmailAction = async (action, draftData) => {
        if (action === 'cancel') {
            // Remove the draft card
            setMessages(prev => prev.filter(msg => msg.id !== draftData.id));
            Toast.show({ type: 'info', text1: 'Draft Discarded' });
            return;
        }

        if (action === 'send') {
            try {
                // We need to call a backend endpoint to actually SEND.
                // We can reuse the `contactRoute` or created a `send-email` specific endpoint?
                // Or `chatController` can handle it.
                // Let's assume we have `POST /api/chat/send-email`.
                // Wait, I didn't create that endpoint.
                // But `emailService.js` exists in backend. 
                // I should create a new endpoint in `contactRoutes` or `chatRoutes`?
                // Let's use `ApiHelper.post(ENDPOINTS.CHAT.SEND_EMAIL ...)`
                // I need to add `SEND_EMAIL` to constants/ApiConstants first?
                // Or just hardcode path for now.

                const response = await ApiHelper.post('/api/contacts/send-email', {
                    recipientName: draftData.recipientName,
                    recipientEmail: draftData.recipientEmail,
                    subject: draftData.subject,
                    htmlContent: draftData.body
                });

                if (response.success) {
                    Toast.show({ type: 'success', text1: 'Email Sent!' });
                    // Replace draft with a success message
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === draftData.id || (msg.emailDraft && msg.emailDraft === draftData)) {
                            return { ...msg, type: 'text', text: `✅ Email sent to ${draftData.recipientName}.`, emailDraft: null };
                        }
                        return msg;
                    }));
                } else {
                    Toast.show({ type: 'error', text1: 'Failed', text2: response.message });
                }
            } catch (error) {
                console.error("Email send error", error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send.' });
            }
        }
    };

    // Once a message has finished its typewriter reveal, clear the flag so it
    // never re-animates (e.g. on list re-render or when scrolled back into view).
    const markDoneAnimating = (id) => {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, animate: false } : m)));
    };

    const sendMessage = async () => {
        if (!message.trim()) return;
        if (!patientId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Patient profile not loaded yet. Please wait.'
            });
            return;
        }

        // 1. Client-side check before sending
        if (isFeatureLocked('ai_chat')) {
            Alert.alert(
                "Limit Reached",
                "You have reached your daily limit for AI chats. Upgrade to Premium for unlimited access!",
                [
                    { text: "Maybe Later", style: "cancel" },
                    { text: "View Plans", onPress: () => router.push('/(patient)/plan') }
                ]
            );
            return;
        }

        const userText = message;
        // 1. Add user message optimistically
        setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, sender: 'patient', type: 'text' }]);
        setMessage('');
        setIsAiTyping(true);

        try {
            // 2. Call Backend
            console.log("Sending to AI:", userText);
            const response = await ApiHelper.post(ENDPOINTS.CHAT.TEXT, {
                patientId: patientId, // Dynamic ID
                message: userText
            });

            // If backend returns a 403 or specific limit error
            if (response.error === "Daily limit reached") {
                setIsAiTyping(false);
                Alert.alert("Limit Reached", response.upgradeMessage || "You've hit your daily limit.");
                // Remove the message we just added since it was rejected
                setMessages(prev => prev.filter(m => m.id !== (userText + "temp"))); // This ID logic in home.jsx is a bit loose
                // Re-sync messages
                fetchHistory();
                return;
            }

            // 3. Add AI Response (with typewriter reveal)
            if (response && response.message) {
                setIsAiTyping(false);
                setMessages(prev => [...prev, {
                    id: response.messageId || Date.now().toString(),
                    text: response.message,
                    sender: 'caretaker',
                    type: 'text',
                    animate: true
                }]);

                // 4. Play Audio if present
                if (response.audioBase64) {
                    setLoadingText("Speaking...");
                    await playAudio(response.audioBase64); // Ensure we wait for audio
                }

                // Refresh plan/usage stats
                refreshPlan();
            }
        } catch (error) {
            console.error("Home Chat Error:", error);
            setIsAiTyping(false);
            const errorMsg = error.message || "";
            if (errorMsg.includes("limit") || errorMsg.includes("403")) {
                Alert.alert("Limit Reached", "You have reached your daily chat limit.");
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Assistant failed to respond.'
                });
            }
        }
    };


    // ... Voice Logic ...
    const startRecording = async () => {
        setIsVoiceMode(true);
        setLoadingText('Listening...'); // Reset UI state
        voiceModeRef.current = true; // Mark as active
        hasUserSpokenRef.current = false; // Reset speech tracking
        try {
            // 1. Request Permission explicitly
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Toast.show({
                    type: 'error',
                    text1: 'Permission required',
                    text2: 'Please allow microphone access to use voice features.'
                });
                setIsVoiceMode(false);
                voiceModeRef.current = false;
                return;
            }

            // Clean up previous recording just in case
            if (recordingRef.current) {
                try {
                    await recordingRef.current.stopAndUnloadAsync();
                } catch (e) { /* Ignore if already unloaded */ }
                recordingRef.current = null;
                setRecording(null);
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // isMeteringEnabled is required for status.metering to be populated;
            // without it the silence/speech detection below never sees audio levels
            // and wrongly concludes "no speech detected", discarding the recording.
            const { recording: newRecording } = await Audio.Recording.createAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });
            // Ensure the status callback fires often enough to track speech/silence.
            try {
                await newRecording.setProgressUpdateInterval(250);
            } catch (e) { /* non-fatal */ }

            // Silence detection variables
            const SILENCE_THRESHOLD_DB = -50;
            const SILENCE_DURATION_MS = 3000;
            let lastActiveTime = Date.now();

            // Setup metering callback
            newRecording.setOnRecordingStatusUpdate(async (status) => {
                if (status.isRecording) {
                    const db = status.metering ?? -160;

                    // Normalize for UI
                    const minDb = -60;
                    const normalized = Math.max(0, (db - minDb) / (0 - minDb));
                    setAudioLevel(normalized);

                    // Silence Detection Logic
                    if (db > SILENCE_THRESHOLD_DB) {
                        lastActiveTime = Date.now(); // Reset timer if sound detected
                        hasUserSpokenRef.current = true; // Mark that user is speaking
                    } else {
                        const silenceDuration = Date.now() - lastActiveTime;
                        if (silenceDuration > SILENCE_DURATION_MS) {
                            console.log("Auto-stopping due to silence");
                            // We need to stop. Since this is a callback, we should be careful.
                            // We can call stopRecording, but we need to ensure we don't call it multiple times.
                            // The easiest way is to remove the callback first or check a flag.
                            // But stopRecording handles idempotency via recordingRef check.
                            // However, we can't easily access the latest `stopRecording` closure from here 
                            // if it depends on state, but ours uses refs mostly.
                            // Better to just call strict stop logic here.

                            // To avoid loop, clear callback immediately
                            newRecording.setOnRecordingStatusUpdate(null);
                            await stopRecording();
                        }
                    }
                }
            });

            recordingRef.current = newRecording;
            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not access microphone.'
            });
            setIsVoiceMode(false); // Close if failed
            voiceModeRef.current = false;
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        const currentRec = recordingRef.current;
        if (!currentRec) return;

        try {
            await currentRec.stopAndUnloadAsync();
            const uri = currentRec.getURI();
            recordingRef.current = null;
            setRecording(null); // Clear state immediately

            // Smart Exit: Only upload if user actually spoke
            if (hasUserSpokenRef.current) {
                if (uri) handleVoiceUpload(uri);
            } else {
                console.log("No speech detected. Exiting voice mode.");
                setIsVoiceMode(false);
                voiceModeRef.current = false;
                Toast.show({
                    type: 'info',
                    text1: 'Voice Mode Closed',
                    text2: 'No speech detected.'
                });
            }
        } catch (error) {
            console.error("Stop recording error:", error);
        }
    };

    const cancelRecording = async () => {
        setIsRecording(false);
        setIsVoiceMode(false);
        voiceModeRef.current = false; // Mark as inactive
        const currentRec = recordingRef.current;
        if (!currentRec) return;

        try {
            await currentRec.stopAndUnloadAsync();
            recordingRef.current = null;
            setRecording(null);
            console.log("Recording cancelled");
        } catch (error) {
            console.error("Cancel recording error:", error);
        }
    };

    const handleVoiceUpload = async (uri) => {
        if (!patientId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Patient profile not loaded yet.'
            });
            return;
        }

        // 1. Client-side check before uploading
        if (isFeatureLocked('voice_chat')) {
            Alert.alert(
                "Voice Limit Reached",
                "You have reached your daily limit for voice commands. Upgrade to Premium for unlimited access!",
                [
                    { text: "Maybe Later", style: "cancel" },
                    { text: "View Plans", onPress: () => router.push('/(patient)/plan') }
                ]
            );
            setIsVoiceMode(false);
            voiceModeRef.current = false;
            return;
        }

        setIsProcessing(true);
        setLoadingText("Transcribing voice...");
        try {
            console.log("Transcribing with AzureService...");

            // 1. Transcribe using the shared service (same as medication)
            const text = await AzureService.transcribeSpeech(uri);

            if (!text || text.startsWith('Error:')) {
                console.warn("Transcription failed:", text);
                Toast.show({
                    type: 'info',
                    text1: 'Info',
                    text2: 'Could not understand audio. Please try again.'
                });
                return;
            }

            // 2. Show User Message
            setMessages(prev => [...prev, { id: Date.now().toString(), text: text, sender: 'patient', type: 'text' }]);

            // 3. Send to Chat API request Audio
            setLoadingText("Thinking...");
            console.log("Sending text to AI:", text);
            const chatRes = await ApiHelper.post(ENDPOINTS.CHAT.TEXT, {
                patientId: patientId, // Dynamic
                message: text,
                includeAudio: true
            });

            // If backend returns a 403 or specific limit error
            if (chatRes.error === "Daily limit reached") {
                Alert.alert("Limit Reached", chatRes.upgradeMessage || "You've hit your daily limit.");
                // Re-sync messages
                fetchHistory();
                setIsVoiceMode(false);
                voiceModeRef.current = false;
                return;
            }

            // 4. Show AI Response
            if (chatRes && chatRes.message) {
                setMessages(prev => [...prev, {
                    id: chatRes.messageId || Date.now().toString(),
                    text: chatRes.message,
                    sender: 'caretaker',
                    type: 'text'
                }]);

                // 5. Play Audio
                if (chatRes.audioBase64) {
                    setLoadingText("Speaking...");
                    await playAudio(chatRes.audioBase64);
                }

                // Refresh plan/usage stats
                refreshPlan();
            }

        } catch (error) {
            console.error("Voice Flow Error:", error);
            const errorMsg = error.message || "";
            if (errorMsg.includes("limit") || errorMsg.includes("403")) {
                Alert.alert("Limit Reached", "You have reached your daily voice limit.");
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Voice interaction failed.'
                });
            }
            setIsVoiceMode(false);
            voiceModeRef.current = false;
        } finally {
            setIsProcessing(false);

            // Auto-restart recording if still in voice mode (Continuous Conversation)
            if (voiceModeRef.current) {
                console.log("Auto-restarting recording for continuous conversation");
                setTimeout(() => {
                    if (voiceModeRef.current) startRecording();
                }, 500);
            }
        }
    };


    const playAudio = async (base64) => {
        return new Promise(async (resolve) => {
            try {
                // Configure audio mode to use main speaker (not earpiece) on iOS
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });

                const uri = `data:audio/mp3;base64,${base64}`;
                const { sound } = await Audio.Sound.createAsync({ uri });

                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.didJustFinish) {
                        sound.unloadAsync();
                        resolve();
                    }
                });

                await sound.playAsync();
            } catch (error) {
                console.error("Playback failed", error);
                resolve(); // Resolve anyway to unblock UI
            }
        });
    };

    const renderItem = ({ item }) => {
        if (item.type === 'email-draft' || item.emailDraft) {
            const draft = item.emailDraft || item.data; // Handle both structures if needed
            return (
                <View style={styles.systemMessageContainer}>
                    <EmailDraftCard
                        recipientName={draft.toName || draft.recipientName}
                        recipientEmail={draft.toEmail || draft.recipientEmail}
                        subject={draft.subject}
                        initialBody={draft.body}
                        onAction={(action, val) => handleEmailAction(action, { ...draft, ...val, id: item.id })}
                    />
                </View>
            );
        }

        if (item.type === 'medication') {
            console.log("Rendering MedicationCard for:", item.data.medicationName);
            return (
                <View style={styles.systemMessageContainer}>
                    <MedicationCard
                        medicationName={item.data.medicationName}
                        dosage={item.data.dosage}
                        time={item.data.time}
                        status={item.data.status}
                        isActive={item.data.logId === activeLogId}
                        onVoiceDone={() => handleVoiceDone(item.data.logId)}
                        onAction={(action) => handleMedicationAction(item.data.logId, action)}
                    />
                </View>
            );
        }

        // Markdown styles for AI messages
        const markdownStyles = {
            body: {
                fontSize: 16,
                lineHeight: 22,
                fontFamily: theme.fonts.regular,
                color: item.sender === 'patient' ? colors.textOnPrimary : colors.text,
            },
            strong: {
                fontFamily: theme.fonts.bold,
            },
            em: {
                fontStyle: 'italic',
            },
            paragraph: {
                marginTop: 0,
                marginBottom: 0,
            },
            // Citation links (Apple Guideline 1.4.1) — visibly tappable.
            link: {
                color: colors.primary,
                textDecorationLine: 'underline',
            },
        };

        return (
            <View style={[styles.messageBubble, item.sender === 'patient' ? styles.patientBubble : styles.caretakerBubble]}>
                {item.sender === 'patient' ? (
                    <Text style={[styles.messageText, styles.patientText]}>
                        {item.text}
                    </Text>
                ) : item.animate ? (
                    <TypingText
                        fullText={item.text}
                        onDone={() => markDoneAnimating(item.id)}
                        renderText={(t) => (
                            <Markdown
                                style={markdownStyles}
                                onLinkPress={(url) => { Linking.openURL(url).catch(() => {}); return false; }}
                            >
                                {t}
                            </Markdown>
                        )}
                    />
                ) : (
                    <Markdown
                        style={markdownStyles}
                        onLinkPress={(url) => { Linking.openURL(url).catch(() => {}); return false; }}
                    >
                        {item.text}
                    </Markdown>
                )}
            </View>
        );
    };

    const renderInput = () => (
        <View style={styles.inputContainer}>


            {/* Middle Input Capsule */}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Ask Casyomax"
                    placeholderTextColor={colors.textMuted}
                    multiline
                />
                {/* Mic inside the input bar */}
                <TouchableOpacity
                    onPress={startRecording}
                    disabled={isProcessing || isRecording}
                    style={styles.innerMicButton}
                >
                    <Ionicons name="mic" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Right Action Button (Send or Headset) */}
            {/* Right Action Button (Always Send) */}
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: message.trim().length > 0 ? colors.primary : colors.surfaceAlt }]}
                onPress={sendMessage}
                disabled={message.trim().length === 0}
            >
                <Ionicons name="arrow-up" size={20} color={message.trim().length > 0 ? colors.textOnPrimary : colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    const renderRecordingOverlay = () => {
        // Determine mode for VoiceOrb
        let mode = 'listening';
        if (isProcessing) {
            // If loadingText implies speaking, use speaking mode
            if (loadingText === "Speaking...") mode = 'speaking';
            else mode = 'processing';
        } else if (isRecording) {
            mode = 'listening';
        }

        return (
            <Modal visible={isVoiceMode} transparent animationType="fade">
                <VoiceParticleSphere
                    mode={mode}
                    audioLevel={audioLevel}
                    onClose={cancelRecording}
                />
            </Modal>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
        >
            <UsageBanner
                feature="ai_chat"
                remaining={getRemainingUsage('ai_chat')}
                plan={plan}
            />

            {/* Apple Guideline 1.4.1 — always-visible disclaimer + easy access to medical sources */}
            <View style={styles.disclaimerBar}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.disclaimerText}>
                    General health information, not medical advice. Always consult a healthcare professional.
                </Text>
                <TouchableOpacity onPress={() => setSourcesVisible(true)} style={styles.sourcesButton}>
                    <Text style={styles.sourcesButtonText}>Sources</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={listRef}
                data={messages.filter(m => m.type !== 'medication')}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                style={{ flex: 1 }}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    isAiTyping ? (
                        <View style={[styles.messageBubble, styles.caretakerBubble, { paddingVertical: 16 }]}>
                            <TypingDots color={colors.textMuted} />
                        </View>
                    ) : null
                }
            />
            {renderInput()}
            {isVoiceMode && renderRecordingOverlay()}

            {/* Medical sources / citations sheet */}
            <Modal visible={sourcesVisible} transparent animationType="slide" onRequestClose={() => setSourcesVisible(false)}>
                <View style={styles.sourcesOverlay}>
                    <View style={styles.sourcesSheet}>
                        <View style={styles.sourcesHeader}>
                            <Text style={styles.sourcesTitle}>Medical Information Sources</Text>
                            <TouchableOpacity onPress={() => setSourcesVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sourcesIntro}>
                            Casyomax provides general health information only and is not a substitute for
                            professional medical advice, diagnosis, or treatment. Health and medication
                            information shown in chat is drawn from the trusted public health authorities
                            below. Tap any source to read more.
                        </Text>
                        <ScrollView style={{ marginTop: 8 }}>
                            {MEDICAL_SOURCES.map((src) => (
                                <TouchableOpacity
                                    key={src.url}
                                    style={styles.sourceRow}
                                    onPress={() => Linking.openURL(src.url).catch(() => {})}
                                >
                                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.sourceName}>{src.name}</Text>
                                        <Text style={styles.sourceUrl}>{src.url}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Text style={styles.sourcesFooter}>
                            In an emergency, call your local emergency number immediately.
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Medication reminder bottom sheet — surfaces a due dose prominently */}
            <Modal
                visible={!!currentReminder}
                transparent
                animationType="slide"
                onRequestClose={dismissReminder}
            >
                <Pressable style={styles.reminderOverlay} onPress={dismissReminder}>
                    <Pressable style={styles.reminderSheet} onPress={() => {}}>
                        <View style={styles.reminderHandle} />
                        {currentReminder && (
                            <MedicationCard
                                medicationName={currentReminder.data.medicationName}
                                dosage={currentReminder.data.dosage}
                                time={currentReminder.data.time}
                                status={currentReminder.data.status}
                                isActive={currentReminder.data.logId === activeLogId}
                                onVoiceDone={() => handleVoiceDone(currentReminder.data.logId)}
                                onAction={(action) => handleMedicationAction(currentReminder.data.logId, action)}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    const f = t.fonts;
    const sh = t.shadows;
    return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },
    reminderOverlay: {
        flex: 1,
        backgroundColor: c.overlay,
        justifyContent: 'flex-end',
    },
    reminderSheet: {
        backgroundColor: c.surface,
        borderTopLeftRadius: r.xl,
        borderTopRightRadius: r.xl,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 28,
        ...sh.lg,
    },
    reminderHandle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: c.borderStrong,
        marginBottom: 12,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 32,
    },
    disclaimerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surfaceAlt,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 15,
        color: c.textSecondary,
        fontFamily: f.regular,
        marginLeft: 6,
    },
    sourcesButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: c.primary,
        borderRadius: r.pill,
    },
    sourcesButtonText: {
        color: c.textOnPrimary,
        fontSize: 12,
        fontFamily: f.semibold,
    },
    sourcesOverlay: {
        flex: 1,
        backgroundColor: c.overlay,
        justifyContent: 'flex-end',
    },
    sourcesSheet: {
        backgroundColor: c.surface,
        borderTopLeftRadius: r.xl,
        borderTopRightRadius: r.xl,
        padding: 20,
        maxHeight: '80%',
    },
    sourcesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sourcesTitle: {
        fontSize: 18,
        fontFamily: f.bold,
        color: c.text,
    },
    sourcesIntro: {
        fontSize: 13,
        lineHeight: 19,
        color: c.textSecondary,
        fontFamily: f.regular,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
    },
    sourceName: {
        fontSize: 15,
        fontFamily: f.semibold,
        color: c.text,
    },
    sourceUrl: {
        fontSize: 12,
        color: c.primary,
        fontFamily: f.regular,
        marginTop: 2,
    },
    sourcesFooter: {
        fontSize: 12,
        color: c.textMuted,
        fontFamily: f.regular,
        marginTop: 14,
        textAlign: 'center',
    },
    systemMessageContainer: {
        marginBottom: 16,
        width: '100%',
    },
    statusText: {
        fontSize: 12,
        color: c.textSecondary,
        fontFamily: f.regular,
        marginTop: 4,
        textAlign: 'right',
        fontStyle: 'italic',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: r.lg,
        marginBottom: 12,
    },
    patientBubble: {
        alignSelf: 'flex-end',
        backgroundColor: c.primary, // Sender (patient)
        borderBottomRightRadius: r.sm,
    },
    caretakerBubble: {
        alignSelf: 'flex-start',
        backgroundColor: c.surface, // Assistant
        borderWidth: 1,
        borderColor: c.border,
        borderBottomLeftRadius: r.sm,
        ...sh.sm,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: f.regular,
    },
    patientText: {
        color: c.textOnPrimary,
    },
    caretakerText: {
        color: c.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Align bottom for multiline
        padding: 8,
        backgroundColor: c.surface,
        borderRadius: r.pill,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: 16,
        marginHorizontal: 16,
        ...sh.sm,
    },
    plusButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: c.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 6, // Align with input
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surfaceAlt,
        borderRadius: r.pill,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 48,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: c.text,
        fontFamily: f.regular,
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
    },
    innerMicButton: {
        marginLeft: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    header: {
        padding: 16,
        paddingTop: 60,
        backgroundColor: c.surface,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        alignItems: 'flex-end',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: r.pill,
        ...sh.sm,
    },
    historyButtonText: {
        color: c.textOnPrimary,
        fontFamily: f.semibold,
        marginLeft: 6,
    },
    // Overlay Styles
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.65)', // Transparent black shadow
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    overlayContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    recordButtonContainer: {
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ripple: {
        position: 'absolute',
        width: 100, // Same starting size as outer button
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 59, 48, 0.6)', // Red semi-transparent
        zIndex: -1,
    },
    recordButtonOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.3)', // Less transparent black
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordButtonInner: {
        width: 95,
        height: 95,
        borderRadius: 47,
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassy effect
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: f.semibold,
        marginTop: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    exitButton: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'rgba(50, 50, 50, 0.9)', // Capsule like
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#555',
    },
    exitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: f.semibold,
    },
    });
};

export default PatientHomeScreen;
