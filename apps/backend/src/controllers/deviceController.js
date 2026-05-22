const { v4: uuid } = require("uuid");
const Device = require("../models/deviceModel");

exports.registerDevice = async (req, res) => {
  const { user_id, expo_push_token } = req.body;

  await Device.saveDeviceToken({
    id: uuid(),
    user_id,
    expo_push_token,
  });

  res.json({ success: true });
};
