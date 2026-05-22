const pool = require("../config/db");

exports.saveDeviceToken = async ({ id, user_id, expo_push_token }) => {
  return pool.query(
    `INSERT INTO user_devices (id, user_id, expo_push_token)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET expo_push_token=$3`,
    [id, user_id, expo_push_token]
  );
};
