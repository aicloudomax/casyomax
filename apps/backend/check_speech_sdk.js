const sdk = require("microsoft-cognitiveservices-speech-sdk");

console.log("SDK Keys:", Object.keys(sdk));
console.log("AudioStreamContainerFormat:", sdk.AudioStreamContainerFormat);
if (sdk.AudioStreamContainerFormat) {
    console.log("AudioStreamContainerFormat keys:", Object.keys(sdk.AudioStreamContainerFormat));
} else {
    console.log("AudioStreamContainerFormat is UNDEFINED");
}

try {
    const format = sdk.AudioStreamFormat.getCompressedFormat(sdk.AudioStreamContainerFormat.ANY);
    console.log("Format created successfully");
} catch (error) {
    console.error("Error creating format:", error.message);
}
