/**
 * FILE: src/services/azureAIService.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Wrapper for chat AI providers and Azure Speech Services.
 * UPDATED: Added Ollama support for local LLM testing.
 * -----------------------------------------------------------------------------
 */
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const axios = require('axios'); // Required for external API calls

const normalizeOllamaBaseUrl = (baseUrl) => baseUrl
    .replace(/\/(?:api|v1)\/?$/, "")
    .replace(/\/+$/, "");

// Load Environment Variables
const AI_PROVIDER = (process.env.AI_PROVIDER || "azure").toLowerCase();
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_DEPLOYMENT_ID = process.env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o-care-sync";
const OLLAMA_BASE_URL = normalizeOllamaBaseUrl(process.env.OLLAMA_BASE_URL || "http://localhost:11434");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);
const OLLAMA_ENABLE_TOOLS = process.env.OLLAMA_ENABLE_TOOLS !== "false";
const OLLAMA_TOOL_MODE = (process.env.OLLAMA_TOOL_MODE || "auto").toLowerCase();
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

// Additional Keys for Tools
const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const BING_SEARCH_KEY = process.env.BING_SEARCH_KEY;

let openAIClient = null;

const getOpenAIClient = () => {
    if (openAIClient) return openAIClient;

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
        throw new Error("Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY, or use AI_PROVIDER=ollama.");
    }

    openAIClient = new OpenAIClient(
        AZURE_OPENAI_ENDPOINT,
        new AzureKeyCredential(AZURE_OPENAI_KEY)
    );

    return openAIClient;
};

const stringifyToolArguments = (args) => {
    if (typeof args === "string") return args;
    return JSON.stringify(args || {});
};

const parseToolArguments = (args) => {
    if (!args) return {};
    if (typeof args === "object") return args;
    return JSON.parse(args);
};

const normalizeToolCall = (toolCall, index = 0) => ({
    id: toolCall.id || `tool-call-${Date.now()}-${index}`,
    type: toolCall.type || "function",
    function: {
        name: toolCall.function?.name,
        arguments: stringifyToolArguments(toolCall.function?.arguments)
    }
});

const toOpenAICompatibleMessages = (messages) => messages.map((message) => {
    const next = {
        role: message.role,
        content: message.content ?? null
    };

    if (message.toolCalls) {
        next.tool_calls = message.toolCalls.map((toolCall, index) => {
            const normalized = normalizeToolCall(toolCall, index);

            return {
                id: normalized.id,
                type: normalized.type,
                function: {
                    name: normalized.function.name,
                    arguments: normalized.function.arguments
                }
            };
        });
    }

    if (message.toolCallId) {
        next.tool_call_id = message.toolCallId;
    }

    return next;
});

const normalizeOpenAICompatibleResult = (result) => ({
    choices: (result.choices || []).map((choice) => ({
        finishReason: choice.finishReason || choice.finish_reason,
        message: {
            content: choice.message?.content || "",
            toolCalls: (choice.message?.toolCalls || choice.message?.tool_calls || []).map(normalizeToolCall)
        }
    }))
});

const getLastUserMessageText = (messages) => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
    return typeof lastUserMessage?.content === "string" ? lastUserMessage.content.toLowerCase() : "";
};

const shouldSendToolsToOllama = (messages, tools) => {
    if (!OLLAMA_ENABLE_TOOLS || !tools?.length) return false;
    if (OLLAMA_TOOL_MODE === "always") return true;
    if (OLLAMA_TOOL_MODE === "never") return false;

    const text = getLastUserMessageText(messages);
    return /\b(weather|forecast|temperature|news|headline|email|mail|contact|schedule|scheduled|sms|message|remind|reminder)\b/.test(text);
};

const callOllamaChatCompletions = async (messages, options = {}) => {
    const tools = shouldSendToolsToOllama(messages, options.tools) ? options.tools : undefined;

    const response = await axios.post(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        model: OLLAMA_MODEL,
        messages: toOpenAICompatibleMessages(messages),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        tools: tools || undefined,
        tool_choice: tools ? options.toolChoice : undefined,
        stream: false
    }, {
        timeout: OLLAMA_TIMEOUT_MS
    });

    return normalizeOpenAICompatibleResult(response.data);
};

const callChatCompletions = async (messages, options = {}) => {
    if (AI_PROVIDER === "ollama") {
        return callOllamaChatCompletions(messages, options);
    }

    if (AI_PROVIDER !== "azure") {
        throw new Error(`Unsupported AI_PROVIDER "${AI_PROVIDER}". Use "azure" or "ollama".`);
    }

    return getOpenAIClient().getChatCompletions(
        AZURE_DEPLOYMENT_ID,
        messages,
        {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            tools: options.tools,
            toolChoice: options.toolChoice
        }
    );
};

/**
 * FEATURE: Weather Service (Azure Maps)
 */
const getCoordinates = async (city) => {
    if (!AZURE_MAPS_KEY) return null;
    try {
        const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&query=${encodeURIComponent(city)}&subscription-key=${AZURE_MAPS_KEY}`;
        const response = await axios.get(url);
        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0].position; // { lat, lon }
        }
        return null;
    } catch (error) {
        console.error("Geocoding Error:", error.message);
        return null;
    }
};

const getWeather = async (locationName) => {
    if (!AZURE_MAPS_KEY) return "Weather service is not configured (Missing Azure Maps Key).";

    try {
        // 1. Get Coordinates
        const coords = await getCoordinates(locationName);
        if (!coords) return `Could not find location: ${locationName}`;

        // 2. Get Current Conditions
        const url = `https://atlas.microsoft.com/weather/currentConditions/json?api-version=1.1&query=${coords.lat},${coords.lon}&subscription-key=${AZURE_MAPS_KEY}`;
        const response = await axios.get(url);

        if (response.data.results && response.data.results.length > 0) {
            const current = response.data.results[0];
            return `Weather in ${locationName}: ${current.phrase}, Temperature: ${current.temperature.value}°${current.temperature.unit}, Humidity: ${current.relativeHumidity}%, Wind: ${current.wind.speed.value} ${current.wind.speed.unit}.`;
        }
        return "Weather data unavailable.";
    } catch (error) {
        console.error("Weather API Error:", error.message);
        return "Failed to fetch weather data.";
    }
};

/**
 * FEATURE: News Service (Bing Search)
 */
const getNews = async (query) => {
    if (!BING_SEARCH_KEY) {
        console.warn("⚠️ BING_SEARCH_KEY is missing/empty in .env");
        return "News service is not configured (Missing Bing Search Key).";
    }

    try {
        // Updated Endpoint to the current standard
        const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=3&mkt=en-US`;

        console.log(`🔎 Calling Bing News Search: ${url}`);

        const response = await axios.get(url, {
            headers: { 'Ocp-Apim-Subscription-Key': BING_SEARCH_KEY }
        });

        if (response.data.value && response.data.value.length > 0) {
            console.log(`✅ Bing News Found ${response.data.value.length} articles`);
            const articles = response.data.value.map(a => `- ${a.name} (${a.provider[0]?.name}): ${a.description}`).join("\n");
            return `Here are the latest news for "${query}":\n${articles}`;
        }
        console.log("⚠️ Bing News returned no articles.");
        return `No news found for "${query}".`;
    } catch (error) {
        // Detailed Error Logging
        if (error.response) {
            console.error(`❌ News API Error: ${error.response.status} ${error.response.statusText}`);
            console.error("Response Data:", JSON.stringify(error.response.data));
        } else {
            console.error("❌ News API Error:", error.message);
        }
        return "Failed to fetch news.";
    }
};

/**
 * Helper: Execute Tool Calls
 */
const executeTool = async (toolCall) => {
    const fnName = toolCall.function.name;
    const args = parseToolArguments(toolCall.function.arguments);

    console.log(`🛠️ Executing Tool: ${fnName} with args:`, args);

    if (fnName === "get_current_weather") {
        return await getWeather(args.location);
    } else if (fnName === "get_news_search") {
        return await getNews(args.query);
    }
    return "Unknown tool function.";
};

/**
 * Generates a chat response using the configured AI provider (Multi-Turn with Tools).
 * @param {Array} messages - List of messages
 * @param {Array} tools - Tool definitions (optional)
 * @param {Function} toolExecutor - Optional callback to execute tools. Signature: (toolCall) => Promise<string>
 * @returns {Promise<string>} - Assistant's response text.
 */
exports.generateChatResponse = async (messages, tools = null, customToolExecutor = null) => {
    try {
        // 1. First Call to LLM
        const result = await callChatCompletions(messages, {
            temperature: 0.7,
            maxTokens: 800,
            tools: tools,
            toolChoice: tools ? "auto" : undefined
        });

        const choice = result.choices[0];
        const message = choice.message;

        // 2. Check if LLM wants to use a Tool
        if (choice.finishReason === "tool_calls" && message.toolCalls?.length) {
            // Append assistant's "thinking" (tool call request) to history
            messages.push({
                role: "assistant",
                content: null,
                toolCalls: message.toolCalls
            });

            // 3. Execute all requested tools
            for (const toolCall of message.toolCalls) {
                let toolResult;

                if (customToolExecutor) {
                    // Try custom executor first
                    toolResult = await customToolExecutor(toolCall);
                }

                // If custom executor didn't handle it (returned null/undefined) or wasn't provided, use default
                if (toolResult === undefined || toolResult === null) {
                    toolResult = await executeTool(toolCall);
                }

                // Append result to history
                messages.push({
                    role: "tool",
                    toolCallId: toolCall.id,
                    content: toolResult
                });
            }

            // 4. Second Call to LLM (with tool results)
            const finalResult = await callChatCompletions(messages, {
                temperature: 0.7,
                maxTokens: 800
            });

            return finalResult.choices[0].message.content;
        }

        // No tool needed, return direct response
        return message.content;

    } catch (error) {
        console.error("AI Provider Error:", error);
        throw new Error("Failed to generate AI response: " + error.message);
    }
};

/**
 * Converts text to speech using Azure Speech SDK.
 */
exports.textToSpeech = async (text) => {
    return new Promise((resolve, reject) => {
        const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
        speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

        synthesizer.speakTextAsync(
            text,
            (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    resolve(Buffer.from(result.audioData));
                } else {
                    reject(new Error(`TTS Failed: ${result.errorDetails}`));
                }
                synthesizer.close();
            },
            (error) => {
                reject(error);
                synthesizer.close();
            }
        );
    });
};

/**
 * Converts audio buffer to text using Azure Speech SDK.
 */
exports.speechToText = async (audioBuffer) => {
    return new Promise((resolve, reject) => {
        const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
        speechConfig.speechRecognitionLanguage = "en-US";

        const format = sdk.AudioStreamFormat.getCompressedFormat();
        const pushStream = sdk.AudioInputStream.createPushStream(format);
        pushStream.write(audioBuffer);
        pushStream.close();

        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(
            (result) => {
                if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                    resolve(result.text);
                } else {
                    console.warn("⚠️ STT No Match or Error:", result);
                    resolve("");
                }
                recognizer.close();
            },
            (error) => {
                console.error("❌ STT Error:", error);
                reject(error);
                recognizer.close();
            }
        );
    });
};
/**
 * Generates a simple completion (Single Turn).
 * Used for internal logic like drafting emails or calculating times.
 */
exports.generateSimpleCompletion = async (systemPrompt, userPrompt) => {
    try {
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const result = await callChatCompletions(messages, {
            temperature: 0.3,
            maxTokens: 200 // Low temp for deterministic results (dates/JSON)
        });

        return result.choices[0].message.content;
    } catch (error) {
        console.error("❌ Simple Completion Error:", error);
        return null; // Return null so caller can handle fallback
    }
};
