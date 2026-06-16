import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from '@/services/SecureStore';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Alert } from '@/services/CrossPlatformAlert';
import { UsageBanner } from '../../components/UsageBanner';
import { ENDPOINTS } from '../../constants/ApiConstants';
import { usePlan } from '../../hooks/usePlan';
import ApiHelper from '../../services/ApiHelper';
import { useTheme } from '../../theme/ThemeProvider';



export default function ChatScreen() {
    const theme = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recording, setRecording] = useState(null);
    const scrollViewRef = useRef();

    const { plan, getRemainingUsage, isFeatureLocked, refreshPlan } = usePlan();


    // Load initial welcome message or history? For now, empty or welcome.
    useEffect(() => {
        setMessages([
            { id: 'system-1', role: 'assistant', content: 'Hello! I am your Casyomax Assistant. How can I help you today?', type: 'text' }
        ]);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    // Request Permissions
    async function requestPermissions() {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Microphone permission is required for voice chat.');
            }
        } catch (err) {
            console.warn(err);
        }
    }

    useEffect(() => {
        requestPermissions();
    }, []);

    const handleSendText = async () => {
        if (!inputText.trim()) return;

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

        const userMsg = { id: Date.now().toString(), role: 'user', content: inputText, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsProcessing(true);

        try {
            const response = await ApiHelper.post(ENDPOINTS.CHAT.TEXT, {
                patientId: 1,
                message: userMsg.content
            });

            // If backend returns a 403 or specific limit error
            if (response.error === "Daily limit reached") {
                Alert.alert("Limit Reached", response.upgradeMessage || "You've hit your daily limit.");
                // Remove the message we just added since it was rejected
                setMessages(prev => prev.filter(m => m.id !== userMsg.id));
                return;
            }

            const assistantMsg = {
                id: response.messageId || Date.now().toString(),
                role: 'assistant',
                content: response.message,
                type: 'text'
            };
            setMessages(prev => [...prev, assistantMsg]);

            // Refresh plan/usage stats
            refreshPlan();

        } catch (error) {
            console.error("CHAT ERROR:", error);
            // Check specifically for 403 / Limit errors if passed through ApiHelper as throw
            const errorMsg = error.message || "";
            if (errorMsg.includes("limit") || errorMsg.includes("403")) {
                Alert.alert("Limit Reached", "You have reached your daily chat limit.");
            } else {
                Alert.alert("Error", "Failed to get response. Please try again.");
            }
            // Optional: remove last user message if it failed
        } finally {
            setIsProcessing(false);
        }
    };


    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        // Send audio
        uploadAudio(uri);
    };

    const uploadAudio = async (uri) => {
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
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Show user voice bubble (placeholder)
            const userMsg = { id: Date.now().toString(), role: 'user', content: '🎤 Voice Message', type: 'voice' };
            setMessages(prev => [...prev, userMsg]);

            // 2. Upload
            const formData = new FormData();
            formData.append('patientId', '1');
            formData.append('audio', {
                uri: uri,
                type: 'audio/m4a',
                name: 'voice.m4a'
            });

            const token = await SecureStore.getItemAsync('userToken');
            const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}${ENDPOINTS.CHAT.VOICE}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData
            });

            if (uploadResponse.status === 403) {
                Alert.alert("Limit Reached", "You have reached your daily voice command limit.");
                setMessages(prev => prev.filter(m => m.id !== userMsg.id));
                return;
            }

            if (!uploadResponse.ok) throw new Error("Upload failed");

            const data = await uploadResponse.json();

            // 3. Add AI Response & Play Audio
            const assistantMsg = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.response,
                type: 'text'
            };
            setMessages(prev => [...prev, assistantMsg]);

            if (data.audioBase64) {
                playAudio(data.audioBase64);
            }

            // Refresh plan/usage stats
            refreshPlan();

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Voice chat failed.");
        } finally {
            setIsProcessing(false);
        }
    };


    const playAudio = async (base64) => {
        try {
            // On web, expo-file-system and the iOS audio-mode API are unavailable.
            // Play straight from a base64 data URI.
            if (Platform.OS === 'web') {
                const { sound } = await Audio.Sound.createAsync({ uri: `data:audio/mp3;base64,${base64}` });
                await sound.playAsync();
                return;
            }

            // Configure audio mode to use main speaker (not earpiece) on iOS
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            const uri = FileSystem.documentDirectory + 'response.mp3';
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
            const { sound } = await Audio.Sound.createAsync({ uri });
            await sound.playAsync();
        } catch (error) {
            console.error("Playback failed", error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <UsageBanner
                feature="ai_chat"
                remaining={getRemainingUsage('ai_chat')}
                plan={plan}
            />

            <ScrollView

                ref={scrollViewRef}
                contentContainerStyle={styles.messagesList}
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageBubble,
                            msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                        ]}
                    >
                        <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>
                            {msg.content}
                        </Text>
                    </View>
                ))}
                {isProcessing && (
                    <View style={styles.loadingBubble}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    editable={!isProcessing && !isRecording}
                />
                {inputText.length > 0 ? (
                    <TouchableOpacity onPress={handleSendText} disabled={isProcessing} style={styles.sendButton}>
                        <Ionicons name="send" size={20} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        disabled={isProcessing}
                        style={[styles.micButton, isRecording && styles.micActive]}
                    >
                        <Ionicons name="mic" size={20} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

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
        messagesList: {
            padding: 16,
            paddingBottom: 20,
        },
        messageBubble: {
            maxWidth: '80%',
            padding: 12,
            borderRadius: r.lg,
            marginBottom: 12,
        },
        userBubble: {
            alignSelf: 'flex-end',
            backgroundColor: c.primary,
            borderBottomRightRadius: 4,
        },
        assistantBubble: {
            alignSelf: 'flex-start',
            backgroundColor: c.surface,
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: c.border,
            ...sh.sm,
        },
        userText: {
            color: c.textOnPrimary,
            fontFamily: f.regular,
            fontSize: 16,
        },
        assistantText: {
            color: c.text,
            fontFamily: f.regular,
            fontSize: 16,
        },
        loadingBubble: {
            alignSelf: 'flex-start',
            backgroundColor: c.surface,
            padding: 12,
            borderRadius: r.lg,
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: c.border,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: c.surface,
            borderTopWidth: 1,
            borderTopColor: c.border,
        },
        input: {
            flex: 1,
            backgroundColor: c.surfaceAlt,
            borderRadius: r.pill,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginRight: 10,
            fontSize: 16,
            color: c.text,
            fontFamily: f.regular,
        },
        sendButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        micButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        micActive: {
            backgroundColor: c.danger,
        }
    });
};
