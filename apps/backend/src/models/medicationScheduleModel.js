const pool = require("../config/db");

exports.createSchedule = async ({
    medication_id,
    created_by,
    schedule_type,
    time_of_day,
    start_date,
    end_date,
    days_of_week,
    notes,
    scheduled_time_utc,
    schedule_timezone
}) => {
    return pool.query(
        `INSERT INTO medication_schedules 
    (medication_id, created_by, schedule_type, time_of_day, start_date, end_date, 
     days_of_week, is_active, notes, scheduled_time_utc, schedule_timezone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10)
     RETURNING *`,
        [
            medication_id,
            created_by,
            schedule_type,
            time_of_day,
            start_date,
            end_date,
            days_of_week,
            notes,
            scheduled_time_utc,
            schedule_timezone
        ]
    );
};

exports.updateSchedule = async ({
    id,
    schedule_type,
    time_of_day,
    start_date,
    end_date,
    days_of_week,
    is_active,
    notes,
    scheduled_time_utc,
    schedule_timezone
}) => {
    // If fields are undefined, keep existing using COALESCE or dynamic build.
    // However, since we use parameterized queries with a fixed set, 
    // we should rely on the caller passing correct values or handle logic.
    // But standard SQL 'COALESCE($x, column)' works if $x is NULL. 
    // Let's assume the controller passed properties or undefined.
    // A clearer way:

    return pool.query(
        `UPDATE medication_schedules
     SET schedule_type = COALESCE($1, schedule_type),
         time_of_day = COALESCE($2, time_of_day),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date),
         days_of_week = COALESCE($5, days_of_week),
         is_active = COALESCE($6, is_active),
         notes = COALESCE($7, notes),
         scheduled_time_utc = COALESCE($8, scheduled_time_utc),
         schedule_timezone = COALESCE($9, schedule_timezone),
         updated_at = NOW()
     WHERE id=$10 RETURNING *`,
        [
            schedule_type,
            time_of_day,
            start_date,
            end_date,
            days_of_week,
            is_active,
            notes,
            scheduled_time_utc, // If undefined, pg might complain unless we pass null
            schedule_timezone,
            id,
        ]
    );
};

exports.deleteSchedule = async (id) => {
    return pool.query("UPDATE medication_schedules SET is_active = false WHERE id=$1", [id]);
};

exports.getSchedulesByMedication = async (id) => {
    return pool.query(
        `SELECT ms.*, m.medicine_name 
     FROM medication_schedules ms
     JOIN medications m ON m.id = ms.medication_id
     WHERE ms.medication_id=$1 AND ms.is_active=true`,
        [id]
    );
};

exports.getSchedulesByPatient = async (patient_id) => {
    return pool.query(
        `SELECT ms.*, m.medicine_name
     FROM medication_schedules ms
     JOIN medications m ON m.id = ms.medication_id
     WHERE m.patient_id=$1 AND ms.is_active=true`,
        [patient_id]
    );
};
