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

  await axios.post("https://exp.host/--/api/v2/push/send", payload);
};
