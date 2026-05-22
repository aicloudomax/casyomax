// jobs/reminderScheduler.js
const cron = require("node-cron");
const pool = require("../src/config/db"); // your postgres pool
const { sendPushNotification } = require("../src/utils/notificationService");

const startReminderScheduler = () => {
  console.log("Reminder scheduler started...");

  // Runs every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const currentTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      // Fetch active schedules due now
      const schedulesQuery = `
        SELECT ms.id AS schedule_id, ms.medication_id, m.medicine_name, m.patient_id, u.phone AS patient_phone
        FROM medication_schedules ms
        JOIN medications m ON ms.medication_id = m.id
        JOIN users u ON m.patient_id = u.id
        WHERE ms.is_active = true
          AND ms.time_of_day = $1
      `;

      const { rows } = await pool.query(schedulesQuery, [
        currentTime.slice(11, 16),
      ]);

      for (const schedule of rows) {
        // Insert reminder record
        await pool.query(
          `INSERT INTO reminders (patient_id, medication_id, schedule_id, status, created_at) VALUES ($1, $2, $3, $4, NOW())`,
          [
            schedule.patient_id,
            schedule.medication_id,
            schedule.schedule_id,
            "pending",
          ]
        );

        // Send notification
        await sendPushNotification(
          schedule.patient_id,
          `Time to take ${schedule.medicine_name}`
        );
      }

      console.log("Reminder check complete at", now.toISOString());
    } catch (error) {
      console.error("Error in reminder scheduler:", error.message);
    }
  });
};

module.exports = startReminderScheduler;
