/**
 * generate_medicine_alarm.js
 * -----------------------------------------------------------------------------
 * Synthesizes a professional medical reminder notification sound conforming to
 * clinical alarm standards and privacy requirements (HIPAA/GDPR compliance).
 * 
 * Flow:
 * 1. 0.0s – 6.0s (6s): Active clinical beeping (gets attention / wakes user).
 * 2. 6.0s – 7.0s (1s): Brief silence.
 * 3. 7.0s – 12.0s (~5s): Privacy-compliant voice prompt: "You have a scheduled health reminder. Please open Casyomax."
 * 4. 12.0s – 13.0s (1s): Brief silence.
 * 5. 13.0s – 29.0s (16s): Active clinical beeping (continues until timeout).
 * 
 * Total duration: 29 seconds (iOS limit is 30 seconds).
 * -----------------------------------------------------------------------------
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sdk = require('microsoft-cognitiveservices-speech-sdk');

const VOICE_TEXT = "You have a scheduled health reminder. Please open Casyomax.";
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'mobile', 'assets', 'notification');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'medicine_alert.wav');

const SAMPLE_RATE = 24000; // 24 kHz mono 16-bit PCM
const BITS_PER_SAMPLE = 16;
const TARGET_DURATION_SEC = 29.0; // Under the 30s iOS limit
const TARGET_SAMPLES = SAMPLE_RATE * TARGET_DURATION_SEC;
const TARGET_DATA_SIZE = TARGET_SAMPLES * (BITS_PER_SAMPLE / 8);

// Tone parameters (Clinical standard beep)
const FREQ_FUNDAMENTAL = 800; // 800 Hz
const HARMONICS = [
    { freq: 1600, weight: 0.4 }, // Harmonic 1
    { freq: 2400, weight: 0.2 }, // Harmonic 2
    { freq: 3200, weight: 0.1 }  // Harmonic 3
];
const VOLUME_FACTOR = 26000; // Safely within signed 16-bit range

function generateWavHeader(dataLength) {
    const buffer = Buffer.alloc(44);
    
    // ChunkID
    buffer.write('RIFF', 0);
    // ChunkSize (file size minus 8 bytes)
    buffer.writeUInt32LE(dataLength + 36, 4);
    // Format
    buffer.write('WAVE', 8);
    // Subchunk1ID
    buffer.write('fmt ', 12);
    // Subchunk1Size (16 for PCM)
    buffer.writeUInt32LE(16, 16);
    // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(1, 20);
    // NumChannels (1 for mono)
    buffer.writeUInt16LE(1, 22);
    // SampleRate
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    buffer.writeUInt32LE(SAMPLE_RATE * 1 * (BITS_PER_SAMPLE / 8), 28);
    // BlockAlign (NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(1 * (BITS_PER_SAMPLE / 8), 32);
    // BitsPerSample
    buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
    // Subchunk2ID
    buffer.write('data', 36);
    // Subchunk2Size
    buffer.writeUInt32LE(dataLength, 40);
    
    return buffer;
}

function synthesizeSpeech(text) {
    return new Promise((resolve, reject) => {
        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            return reject(new Error("AZURE_SPEECH_KEY or AZURE_SPEECH_REGION is missing in backend .env"));
        }

        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
        speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

        console.log(`🎙️ Synthesizing speech: "${text}"...`);
        synthesizer.speakTextAsync(
            text,
            (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("✅ Speech synthesis completed.");
                    resolve(Buffer.from(result.audioData));
                } else {
                    reject(new Error(`TTS synthesis failed: ${result.errorDetails}`));
                }
                synthesizer.close();
            },
            (error) => {
                synthesizer.close();
                reject(error);
            }
        );
    });
}

function generateAlarmSamples(count) {
    const samples = Buffer.alloc(count * 2); // 16-bit = 2 bytes per sample
    
    // An alarm cycle is 2.0 seconds (48000 samples at 24kHz)
    // 3 Beeps pattern:
    // - Beep 1: 150ms (3600 samples)
    // - Silence: 100ms (2400 samples)
    // - Beep 2: 150ms (3600 samples)
    // - Silence: 100ms (2400 samples)
    // - Beep 3: 150ms (3600 samples)
    // - Silence: 1350ms (32400 samples)
    const cycleLength = 48000;
    const beepLength = 3600;
    const silenceLength = 2400;

    const fadeLength = 480; // 20ms fade-in / fade-out to prevent pops
    
    for (let i = 0; i < count; i++) {
        const cycleIndex = i % cycleLength;
        
        let inBeep = false;
        let beepSampleIndex = 0;
        
        // Check if inside Beep 1
        if (cycleIndex < beepLength) {
            inBeep = true;
            beepSampleIndex = cycleIndex;
        }
        // Check if inside Beep 2
        else if (cycleIndex >= beepLength + silenceLength && cycleIndex < (beepLength * 2) + silenceLength) {
            inBeep = true;
            beepSampleIndex = cycleIndex - (beepLength + silenceLength);
        }
        // Check if inside Beep 3
        else if (cycleIndex >= (beepLength * 2) + (silenceLength * 2) && cycleIndex < (beepLength * 3) + (silenceLength * 2)) {
            inBeep = true;
            beepSampleIndex = cycleIndex - ((beepLength * 2) + (silenceLength * 2));
        }

        let val = 0;
        if (inBeep) {
            // Synthesize multi-tone alarm signal
            const t = beepSampleIndex / SAMPLE_RATE;
            
            // Fundamental tone
            let toneVal = Math.sin(2 * Math.PI * FREQ_FUNDAMENTAL * t);
            let weightSum = 1.0;
            
            // Add harmonics
            for (const harmonic of HARMONICS) {
                toneVal += harmonic.weight * Math.sin(2 * Math.PI * harmonic.freq * t);
                weightSum += harmonic.weight;
            }
            
            // Normalize tone
            toneVal = toneVal / weightSum;
            
            // Apply amplitude envelope (fade-in / fade-out)
            let envelope = 1.0;
            if (beepSampleIndex < fadeLength) {
                envelope = beepSampleIndex / fadeLength; // Linear fade-in
            } else if (beepSampleIndex > beepLength - fadeLength) {
                envelope = (beepLength - beepSampleIndex) / fadeLength; // Linear fade-out
            }
            
            val = Math.round(toneVal * envelope * VOLUME_FACTOR);
        }
        
        // Write signed 16-bit integer
        samples.writeInt16LE(val, i * 2);
    }
    
    return samples;
}

async function main() {
    try {
        // Ensure output folder exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // 1. Synthesize speech voice prompt (Privacy compliant text)
        const voiceWav = await synthesizeSpeech(VOICE_TEXT);
        
        // 2. Extract raw PCM from the WAV container returned by Azure
        const dataHeaderIndex = voiceWav.indexOf('data');
        if (dataHeaderIndex === -1) {
            throw new Error("Could not find 'data' header in Azure synthesized WAV output.");
        }
        const rawVoicePcm = voiceWav.subarray(dataHeaderIndex + 8);
        const voiceSamplesCount = rawVoicePcm.length / 2;
        console.log(`Voice prompt length: ${(voiceSamplesCount / SAMPLE_RATE).toFixed(2)} seconds (${voiceSamplesCount} samples).`);

        // 3. Prepare final combined data buffer
        const finalPcmBuffer = Buffer.alloc(TARGET_DATA_SIZE);
        
        // --- LAYOUT CONSTRUCT ---
        
        // Section A: Alarm 1 (0s to 6.0s = 6 seconds)
        const alarm1SamplesCount = SAMPLE_RATE * 6.0;
        console.log("Generating Section 1: Alarm Beeps (0s - 6s)...");
        const alarm1Pcm = generateAlarmSamples(alarm1SamplesCount);
        alarm1Pcm.copy(finalPcmBuffer, 0);

        // Section B: Silence 1 (6.0s to 7.0s = 1 second)
        // Kept as 0s in the buffer
        
        // Section C: Voice Prompt (7.0s to 7s + voice duration)
        const voiceStartByteOffset = SAMPLE_RATE * 7.0 * 2;
        const voiceByteSize = Math.min(rawVoicePcm.length, TARGET_DATA_SIZE - voiceStartByteOffset);
        console.log(`Injecting Section 3: Voice prompt at offset 7.0s...`);
        rawVoicePcm.copy(finalPcmBuffer, voiceStartByteOffset, 0, voiceByteSize);

        // Section D: Silence 2 (1.0 second after voice prompt ends)
        const voiceEndSampleIndex = (SAMPLE_RATE * 7.0) + (voiceByteSize / 2);
        const silence2SamplesCount = SAMPLE_RATE * 1.0;
        
        // Section E: Alarm 2 (From Silence 2 end until target 29.0s)
        const alarm2StartSampleIndex = Math.min(voiceEndSampleIndex + silence2SamplesCount, TARGET_SAMPLES);
        if (alarm2StartSampleIndex < TARGET_SAMPLES) {
            const remainingSamplesCount = TARGET_SAMPLES - alarm2StartSampleIndex;
            console.log(`Generating Section 5: Alarm Beeps (${(remainingSamplesCount / SAMPLE_RATE).toFixed(2)}s) to end...`);
            
            const alarm2Pcm = generateAlarmSamples(remainingSamplesCount);
            alarm2Pcm.copy(finalPcmBuffer, alarm2StartSampleIndex * 2);
        }

        // 4. Generate standard 44-byte WAV header and write the file
        console.log(`Writing combined file: ${OUTPUT_FILE}...`);
        const header = generateWavHeader(TARGET_DATA_SIZE);
        
        const fileStream = fs.createWriteStream(OUTPUT_FILE);
        fileStream.write(header);
        fileStream.write(finalPcmBuffer);
        fileStream.end();
        
        fileStream.on('finish', () => {
            const stats = fs.statSync(OUTPUT_FILE);
            console.log(`🎉 Success! Privacy-compliant custom alarm file written successfully.`);
            console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
            console.log(`Path: ${OUTPUT_FILE}`);
        });

    } catch (error) {
        console.error("❌ Audio Generation Failed:", error);
    }
}

main();
