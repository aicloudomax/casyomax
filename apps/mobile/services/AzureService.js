import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as SecureStore from '@/services/SecureStore';
import { API_BASE_URL, ENDPOINTS } from '../constants/ApiConstants';

const AzureService = {
    /**
     * Synthesizes text to speech and returns the local URI of the audio file.
     * @param {string} text - The text to speak.
     * @returns {Promise<string>} - Local URI of the saved audio file.
     */
    synthesizeSpeech: async (text) => {
        try {
            console.log("🔹 Requesting TTS from Backend...");

            // Get auth token from secure storage
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const fileUri = FileSystem.documentDirectory + 'tts_output.mp3';
            const url = `${API_BASE_URL}${ENDPOINTS.VOICE.SYNTHESIZE}`;

            const fetchResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ text })
            });

            if (!fetchResponse.ok) {
                const errText = await fetchResponse.text();
                throw new Error(`TTS Backend Error: ${fetchResponse.status} ${errText}`);
            }

            const blob = await fetchResponse.blob();

            // On web, expo-file-system is unavailable. Play straight from an
            // in-memory object URL instead of writing to a local file.
            if (Platform.OS === 'web') {
                return URL.createObjectURL(blob);
            }

            // Native: convert blob to base64 and write to a file, return its URI.
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const base64data = reader.result.split(',')[1];
                    await FileSystem.writeAsStringAsync(fileUri, base64data, {
                        encoding: 'base64',
                    });
                    resolve(fileUri);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

        } catch (error) {
            console.warn('⚠️ TTS Error:', error);
            throw error;
        }
    },

    /**
     * Transcribes speech from an audio file by uploading it to a backend service.
     * @param {string} audioUri - Local URI of the audio file.
     * @returns {Promise<string>} - Transcribed text.
     */
    transcribeSpeech: async (audioUri) => {
        try {
            console.log("🔹 Uploading audio to backend for transcoding & STT...");

            // Get auth token from secure storage
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            const headers = { 'Authorization': `Bearer ${token}` };

            if (Platform.OS === 'web') {
                // On web the recording URI is a blob: URL. Fetch it into a real Blob
                // and let the browser set the multipart boundary (don't set Content-Type).
                const audioBlob = await (await fetch(audioUri)).blob();
                const ext = audioBlob.type.includes('webm') ? 'webm'
                    : audioBlob.type.includes('wav') ? 'wav' : 'm4a';
                formData.append('audio', audioBlob, `recording.${ext}`);
            } else {
                formData.append('audio', {
                    uri: audioUri,
                    type: 'audio/m4a', // Expo records as m4a/aac by default on Android
                    name: 'recording.m4a',
                });
                headers['Content-Type'] = 'multipart/form-data';
            }

            const url = `${API_BASE_URL}${ENDPOINTS.VOICE.TRANSCRIBE}`;
            console.log(`🔹 Uploading audio to: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend Error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log("🔹 Backend STT Response:", data);

            return data.text || '';

        } catch (error) {
            console.warn('❌ STT Error:', error);
            return `Error: ${error.message}`;
        }
    }
};

export default AzureService;
