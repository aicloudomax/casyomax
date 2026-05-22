const pool = require("../config/db");

exports.createScheduledMessage = async ({
    user_id,
    recipient_email,
    recipient_phone,
    message_type,
    content,
    scheduled_time_utc,
    schedule_timezone
}) => {
    return pool.query(
        `INSERT INTO caresync.scheduled_messages 
        (user_id, recipient_email, recipient_phone, message_type, content, scheduled_time_utc, schedule_timezone, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
        RETURNING *`,
        [user_id, recipient_email, recipient_phone, message_type, content, scheduled_time_utc, schedule_timezone]
    );
};

exports.getPendingMessagesDue = async () => {
    return pool.query(
        `SELECT * FROM caresync.scheduled_messages 
         WHERE status = 'PENDING' 
         AND scheduled_time_utc <= NOW() AT TIME ZONE 'UTC'`
    );
};

exports.updateMessageStatus = async (id, status) => {
    return pool.query(
        `UPDATE caresync.scheduled_messages 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2 RETURNING *`,
        [status, id]
    );
};
