import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import AzureService from '../services/AzureService';

export const useVoiceAssistant = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');

    const soundRef = useRef(null);
    const recordingRef = useRef(null);

    useEffect(() => {
        return () => {
            if (soundRef.current) {
                const sound = soundRef.current;
                soundRef.current = null; // Detach ref immediately
                sound.unloadAsync().catch(e => console.log('Error unloading sound:', e));
            }
            if (recordingRef.current) {
                const recording = recordingRef.current;
                recordingRef.current = null; // Detach ref immediately
                recording.stopAndUnloadAsync().catch(e => console.log('Error unloading recording:', e));
            }
        };
    }, []);

    const speak = async (text, onComplete) => {
        try {
            console.log("🔊 Speaking:", text);
            setIsSpeaking(true);

            // Configure audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false,
            });

            const audioUri = await AzureService.synthesizeSpeech(text);
            console.log("🎵 Audio URI:", audioUri);

            // On web the URI is an in-memory object URL that can't be stat'd;
            // expo-file-system isn't available either, so play it directly.
            if (Platform.OS !== 'web') {
                // Verify file exists
                const fileInfo = await FileSystem.getInfoAsync(audioUri);

                if (!fileInfo.exists) {
                    console.warn("Audio file not found at URI, skipping playback");
                    setIsSpeaking(false);
                    if (onComplete) onComplete();
                    return;
                }
            }

            // Unload previous sound if any
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true, volume: 1.0 }
            );
            soundRef.current = sound;

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    console.log("✅ Speech finished");
                    setIsSpeaking(false);
                    if (onComplete) onComplete();
                }
            });
        } catch (error) {
            console.error('❌ Error speaking:', error);
            setIsSpeaking(false);
            // Crucial: Call onComplete even on error so the flow continues!
            if (onComplete) onComplete();
        }
    };

    const startListening = async () => {
        try {
            if (recordingRef.current) {
                console.warn('⚠️ Already recording, stopping first...');
                try {
                    await recordingRef.current.stopAndUnloadAsync();
                } catch (e) {
                    console.log('Error unloading previous recording:', e);
                }
                recordingRef.current = null;
            }

            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recordingOptions = {
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    audioQuality: Audio.IOSAudioQuality.MAX,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/wav',
                    bitsPerSecond: 128000,
                },
            };

            const { recording } = await Audio.Recording.createAsync(recordingOptions);
            recordingRef.current = recording;
            setIsListening(true);
            console.log('Listening...');
        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsListening(false);
        }
    };

    const stopListening = async () => {
        if (!recordingRef.current) {
            console.log('⚠️ No recording to stop');
            return '';
        }

        try {
            setIsListening(false);
            setIsProcessing(true);

            const recording = recordingRef.current;
            recordingRef.current = null; // Clear ref immediately to prevent race conditions

            const status = await recording.getStatusAsync();
            if (status.isRecording) {
                await recording.stopAndUnloadAsync();
            } else if (status.isDoneRecording) {
                // Already stopped, just unload if needed or do nothing
                // await recording.unloadAsync(); // stopAndUnloadAsync handles this
            }

            const uri = recording.getURI();

            console.log('Recording stopped and stored at', uri);

            const text = await AzureService.transcribeSpeech(uri);
            console.log("📝 Raw Transcript:", text);
            setTranscript(text);
            setIsProcessing(false);
            return text;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setIsProcessing(false);
            return '';
        }
    };

    const processCommand = (text) => {
        console.log("🔍 Processing Voice Command:", text);
        const lowerText = text.toLowerCase().trim();

        // Helper to check for whole words or specific patterns
        const matches = (patterns) => patterns.some(p => new RegExp(`\\b${p}\\b`, 'i').test(lowerText) || lowerText.includes(p));

        // TAKEN / YES
        // Includes: yes, yeah, yep, s (common misinterpretation of yes), sure, ok, taken, confirm, done, right
        if (matches(['taken', 'yes', 'yeah', 'yep', 's', 'sure', 'ok', 'okay', 'confirm', 'done', 'right', 'correct'])) {
            console.log("✅ Matched Command: TAKEN");
            return 'taken';
        }

        // MISSED / NO
        // Includes: no, nope, nah, missed, not yet, cancel, wrong, stop
        else if (matches(['no', 'nope', 'nah', 'missed', 'not', 'cancel', 'wrong', 'stop'])) {
            console.log("✅ Matched Command: MISSED");
            return 'missed';
        }

        // SNOOZE / LATER
        // Includes: later, snooze, remind, wait, hold, delay, 5 minutes, five minutes
        else if (matches(['later', 'snooze', 'remind', 'wait', 'hold', 'delay', 'min', 'minute'])) {
            console.log("✅ Matched Command: SNOOZE");
            return 'snooze';
        }

        console.log("⚠️ No Command Matched");
        return null;
    };

    return {
        isSpeaking,
        isListening,
        isProcessing,
        transcript,
        speak,
        startListening,
        stopListening,
        processCommand
    };
};
