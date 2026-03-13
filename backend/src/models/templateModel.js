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

const normalizeTemplateName = (value = "") => value.trim().replace(/\s+/g, " ");

const normalizeStatus = (value) =>
  String(value || "active").toLowerCase() === "inactive" ? "inactive" : "active";

class Template {
  static async create(data) {
    const q = `
      INSERT INTO templates
      (name, entity_type, entity_id, status, schema_json)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await db.execute(q, [
      normalizeTemplateName(data.name),
      data.entity_type,
      data.entity_id,
      normalizeStatus(data.status),
      JSON.stringify(data.schema_json || {}),
    ]);

    // db.execute returns rows/okPacket directly (not [rows, fields])
    return result?.insertId || null;
  }

  static async getAll(filters = {}) {
    const where = ["is_deleted = 0"];
    const params = [];

    if (filters.entity_type) {
      where.push("entity_type = ?");
      params.push(filters.entity_type);
    }

    if (filters.entity_id) {
      where.push("entity_id = ?");
      params.push(filters.entity_id);
    }

    if (filters.status) {
      where.push("status = ?");
      params.push(normalizeStatus(filters.status));
    } else if (!filters.includeInactive) {
      where.push("status = 'active'");
    }

    const q = `
      SELECT *
      FROM templates
      WHERE ${where.join(" AND ")}
      ORDER BY id DESC
    `;

    const rows = await db.execute(q, params); // ✅ rows array directly

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
          status = ?,
          schema_json = ?,
          version = version + 1
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await db.execute(q, [
      normalizeTemplateName(data.name),
      normalizeStatus(data.status),
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

  static async findActiveDuplicateByName(name, excludeId = null) {
    const normalizedName = normalizeTemplateName(name);
    if (!normalizedName) return null;

    const q = `
      SELECT id, name, status
      FROM templates
      WHERE is_deleted = 0
        AND LOWER(TRIM(name)) = LOWER(TRIM(?))
        ${excludeId ? "AND id <> ?" : ""}
      LIMIT 1
    `;

    const params = excludeId ? [normalizedName, excludeId] : [normalizedName];
    const rows = await db.execute(q, params);
    return Array.isArray(rows) ? rows[0] || null : null;
  }
}

module.exports = Template;