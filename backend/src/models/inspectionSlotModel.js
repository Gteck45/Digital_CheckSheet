const db = require('../config/db');

class InspectionSlot {

  // Create
  static async create(slot_id, shift, start_time, end_time, fill_window = 120, grace_period = 10) {
    const sql = `
      INSERT INTO \`inspection_slots\`
      (slot_id, shift, start_time, end_time, fill_window, grace_period)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return db.execute(sql, [slot_id, shift, start_time, end_time, fill_window, grace_period]);
  }

  // Count (for pagination)
  static async count(search = "") {
    const s = `%${String(search || "").trim()}%`;
    const sql = `
      SELECT COUNT(*) AS total
      FROM \`inspection_slots\`
      WHERE slot_id LIKE ? OR shift LIKE ?
    `;
    const [rows] = await db.execute(sql, [s, s]);
    return rows?.total ?? 0;
  }

  // Get paged
  static async getPaged(search = "", offset = 0, limit = 10) {
    const s = `%${String(search || "").trim()}%`;
    const sql = `
      SELECT *
      FROM \`inspection_slots\`
      WHERE slot_id LIKE ? OR shift LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    return db.execute(sql, [s, s, Number(limit), Number(offset)]);
  }

  // Get all raw (no pagination)
  static async getAllRaw() {
    const sql = `
      SELECT *
      FROM \`inspection_slots\`
      ORDER BY id DESC
    `;
    return db.execute(sql);
  }

  // Get By ID
  static async getById(id) {
    const sql = `
      SELECT *
      FROM \`inspection_slots\`
      WHERE id = ?
    `;
    const rows = await db.execute(sql, [id]);
    return rows[0] || null;
  }

  // Get by Shift (for overlap check)
  static async getByShift(shift, excludeId = null) {
    let sql = `
      SELECT *
      FROM \`inspection_slots\`
      WHERE shift = ?
    `;
    const params = [shift];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    sql += ` ORDER BY start_time`;

    return db.execute(sql, params);
  }

  // Update (partial)
  static async update(id, data) {
    const set = [];
    const params = [];

    const fields = [
      "slot_id",
      "shift",
      "start_time",
      "end_time",
      "fill_window",
      "grace_period"
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        set.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    if (!set.length) return;

    const sql = `
      UPDATE \`inspection_slots\`
      SET ${set.join(', ')}
      WHERE id = ?
    `;

    params.push(id);
    return db.execute(sql, params);
  }

  // Hard Delete
  static async hardDelete(id) {
    const sql = `
      DELETE FROM \`inspection_slots\`
      WHERE id = ?
    `;
    return db.execute(sql, [id]);
  }

}

module.exports = InspectionSlot;