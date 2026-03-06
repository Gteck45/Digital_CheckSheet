// src/models/templateModel.js
const db = require("../config/db");

const safeJsonParse = (val) => {
  if (val == null) return null;
  if (typeof val === "object") return val; // JSON column may already be object
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
};

class Template {
  static async create(data) {
    const q = `
      INSERT INTO templates
      (name, entity_type, entity_id, schema_json)
      VALUES (?, ?, ?, ?)
    `;

    const result = await db.execute(q, [
      data.name,
      data.entity_type,
      data.entity_id,
      JSON.stringify(data.schema_json || {}),
    ]);

    // db.execute returns rows/okPacket directly (not [rows, fields])
    return result?.insertId || null;
  }

  static async getAll() {
    const q = `
      SELECT *
      FROM templates
      WHERE is_deleted = 0
      ORDER BY id DESC
    `;

    const rows = await db.execute(q); // ✅ rows array directly

    return (Array.isArray(rows) ? rows : []).map((r) => ({
      ...r,
      schema_json: safeJsonParse(r.schema_json),
    }));
  }

  static async getById(id) {
    const q = `
      SELECT *
      FROM templates
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `;

    const rows = await db.execute(q, [id]); // ✅ rows array directly
    const row = Array.isArray(rows) ? rows[0] : null;

    if (!row) return null;

    return {
      ...row,
      schema_json: safeJsonParse(row.schema_json),
    };
  }

  static async update(id, data) {
    const q = `
      UPDATE templates
      SET name = ?,
          schema_json = ?,
          version = version + 1
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await db.execute(q, [
      data.name,
      JSON.stringify(data.schema_json || {}),
      id,
    ]);

    return (result?.affectedRows || 0) > 0;
  }

  static async softDelete(id) {
    const result = await db.execute(
      `UPDATE templates
       SET is_deleted = 1, deleted_at = NOW()
       WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    return (result?.affectedRows || 0) > 0;
  }

  static async restore(id) {
    const result = await db.execute(
      `UPDATE templates
       SET is_deleted = 0, deleted_at = NULL
       WHERE id = ? AND is_deleted = 1`,
      [id]
    );

    return (result?.affectedRows || 0) > 0;
  }

  static async hardDelete(id) {
    const result = await db.execute(`DELETE FROM templates WHERE id = ?`, [id]);

    return (result?.affectedRows || 0) > 0;
  }
}

module.exports = Template;