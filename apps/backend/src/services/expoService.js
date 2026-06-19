const axios = require("axios");

exports.sendPush = async (token, title, body, data = {}, options = {}) => {
  const payload = {
    to: token,
    sound: options.sound || "default",
    title,
    body,
    data,
  };

  if (options.channelId) {
    payload.channelId = options.channelId;
  }

  const res = await axios.post("https://exp.host/--/api/v2/push/send", payload);

  // Expo returns HTTP 200 even when a push is rejected (e.g. FCM credentials
  // missing, or the device unregistered). The error lives in the ticket body,
  // so surface it instead of silently assuming success.
  const ticket = res.data?.data;
  const entry = Array.isArray(ticket) ? ticket[0] : ticket;
  if (entry?.status === "error") {
    const reason = entry.details?.error || "unknown";
    throw new Error(`Expo push rejected (${reason}): ${entry.message || "no message"}`);
  }
  return entry;
};
