const pool = require("../config/db");

const MedicationModel = {

    getByPatientId: async (patientId) => {
        console.log("MedicationModel.getByPatientId called for:", patientId);
        const result = await pool.query(
            `SELECT * FROM medications
         WHERE patient_id = $1
         ORDER BY created_at DESC`,
            [patientId]
        );
        console.log("MedicationModel.getByPatientId result count:", result.rows.length);
        console.log("Query result:", result.rows);

        return result.rows;
    },


    create: async (payload) => {
        const { patient_id, created_by, medicine_name, dosage, form, instructions } = payload;
        const result = await pool.query(
            `INSERT INTO medications (patient_id, created_by, medicine_name, dosage, form, instructions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [patient_id, created_by, medicine_name, dosage, form, instructions]
        );
        return result.rows[0];
    },

    update: async (id, payload) => {
        console.log("MedicationModel.update called for:", id, "Payload:", payload);
        const { medicine_name, dosage, form, instructions, is_active } = payload;

        // Build dynamic query based on provided fields
        const fields = [];
        const values = [];
        let query = "UPDATE medications SET ";

        if (medicine_name !== undefined) { fields.push(`medicine_name=$${fields.length + 1}`); values.push(medicine_name); }
        if (dosage !== undefined) { fields.push(`dosage=$${fields.length + 1}`); values.push(dosage); }
        if (form !== undefined) { fields.push(`form=$${fields.length + 1}`); values.push(form); }
        if (instructions !== undefined) { fields.push(`instructions=$${fields.length + 1}`); values.push(instructions); }
        if (is_active !== undefined) { fields.push(`is_active=$${fields.length + 1}`); values.push(is_active); }

        fields.push(`updated_at=NOW()`);

        query += fields.join(", ");
        query += ` WHERE id=$${values.length + 1} RETURNING *`;
        values.push(id);

        console.log("MedicationModel.update Query:", query, "Values:", values);

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (err) {
            console.error("MedicationModel.update Error:", err);
            throw err;
        }
    },

    delete: async (id) => {
        // Permanently delete the medication along with its schedules and dose logs.
        // Order matters because of FKs: logs -> schedules -> medication.
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const schedRes = await client.query(
                "SELECT id FROM medication_schedules WHERE medication_id = $1",
                [id]
            );
            const schedIds = schedRes.rows.map((r) => r.id);

            if (schedIds.length > 0) {
                await client.query("DELETE FROM medication_logs WHERE schedule_id = ANY($1)", [schedIds]);
                await client.query("DELETE FROM medication_schedules WHERE id = ANY($1)", [schedIds]);
            }

            const result = await client.query(
                "DELETE FROM medications WHERE id = $1 RETURNING *",
                [id]
            );

            await client.query("COMMIT");
            return result.rows[0];
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }
};

module.exports = MedicationModel;
