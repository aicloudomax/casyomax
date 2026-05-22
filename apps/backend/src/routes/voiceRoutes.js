const express = require('express');
const router = express.Router();
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const azureAIService = require('../services/azureAIService');
const { verifyToken } = require('../middleware/authMiddleware');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);


// Configure multer for temp file storage
const upload = multer({ dest: 'temp_uploads/' });

router.post('/transcribe', verifyToken, upload.single('audio'), async (req, res) => {
    console.log('🎤 Received audio for transcription');

    if (!req.file) {
        console.error('❌ No file received in request');
        return res.status(400).json({ error: 'No audio file uploaded' });
    }

    console.log('📁 Uploaded File Details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });

    // Fix: Rename file with .m4a extension so ffmpeg detects format correctly
    const inputPath = req.file.path + '.m4a';
    await fs.move(req.file.path, inputPath);

    const outputPath = req.file.path + '.wav';

    try {
        console.log(`🔄 Converting ${req.file.mimetype} to WAV...`);

        // Convert to WAV (16kHz, Mono, 16-bit PCM) - Required by Azure
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('wav')
                .audioFrequency(16000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .on('start', (commandLine) => {
                    console.log('Spawned Ffmpeg with command: ' + commandLine);
                })
                .on('end', () => {
                    console.log('✅ Conversion finished');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ Conversion error:', err);
                    reject(err);
                })
                .save(outputPath);
        });

        // Check output file size
        const stats = await fs.stat(outputPath);
        console.log(`📦 Converted WAV size: ${stats.size} bytes`);

        if (stats.size === 0) {
            throw new Error("Converted file is empty");
        }

        // Read the converted file
        const audioData = await fs.readFile(outputPath);

        // Send to Azure STT
        console.log('🚀 Sending to Azure STT...');
        const azureKey = process.env.AZURE_SPEECH_KEY;
        const azureRegion = process.env.AZURE_SPEECH_REGION;

        if (!azureKey || !azureRegion) {
            throw new Error('Azure credentials missing in backend .env');
        }

        const response = await axios.post(
            `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
            audioData,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': azureKey,
                    'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
                    'Accept': 'application/json'
                }
            }
        );

        console.log('🔹 Azure Response Status:', response.status);
        console.log('🔹 Azure Response Data:', JSON.stringify(response.data, null, 2));

        // Cleanup temp files
        await fs.remove(inputPath);
        await fs.remove(outputPath);

        if (response.data.RecognitionStatus === 'Success') {
            res.json({ text: response.data.DisplayText });
        } else {
            console.warn('⚠️ STT Failed:', response.data.RecognitionStatus);
            res.json({ text: '' });
        }

    } catch (error) {
        console.error('❌ Transcription Error:', error.message);
        if (error.response) {
            console.error('Azure Error Data:', error.response.data);
        }
        // Cleanup on error
        await fs.remove(inputPath).catch(() => { });
        await fs.remove(outputPath).catch(() => { });

        res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
});

router.post('/synthesize', verifyToken, express.json(), async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        console.log(`🔊 Synthesizing speech for: "${text}"`);
        const audioBuffer = await azureAIService.textToSpeech(text);

        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);

    } catch (error) {
        console.error('❌ TTS Error:', error);
        res.status(500).json({ error: 'TTS failed', details: error.message });
    }
});

module.exports = router;
