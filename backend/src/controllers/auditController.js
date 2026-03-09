const { pool } = require("../config/db");

/* ===============================
   GET AUDIT CONFIG
================================*/

const getAuditConfig = async (req, res) => {
  try {
    const { type, id } = req.query;

    if (!type || !id) {
      return res.status(400).json({ message: "type and id required" });
    }

    const [templates] = await pool.query(
      `SELECT id, name
       FROM templates
       WHERE entity_type = ?
       AND entity_id = ?
       AND deleted_at IS NULL
       LIMIT 1`,
      [type, id]
    );

    if (!templates.length) {
      return res.json({ data: { template_name: null, current_slot: null } });
    }

    const template = templates[0];

    const [slots] = await pool.query(`SELECT * FROM inspection_slots`);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    let currentSlot = null;

    for (const s of slots) {
      const start = String(s.start_time).slice(0, 5);
      const end = String(s.end_time).slice(0, 5);
      if (currentTime >= start && currentTime <= end) {
        currentSlot = s;
        break;
      }
    }

    res.json({ data: { template_name: template.name, current_slot: currentSlot } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load audit config" });
  }
};

/* ===============================
   SAVE AUDIT
================================*/

const saveAudit = async (req, res) => {
  try {
    const {
      entity_type,
      entity_id,
      entity_name,
      template_id,
      template_name,
      slot_id,
      auditor_name,
      audit_date,
      audit_time,
      answers,
    } = req.body;

    if (!entity_type || !entity_id || !template_id || !answers || !audit_date || !audit_time) {
      return res.status(400).json({ message: "Missing required fields: entity_type, entity_id, template_id, answers, audit_date, audit_time" });
    }

    const auditor_id = req.user?.id || null;

    const [result] = await pool.execute(
      `INSERT INTO audits
       (entity_type, entity_id, entity_name, template_id, template_name,
        slot_id, auditor_id, auditor_name, audit_date, audit_time, answers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entity_type,
        entity_id,
        entity_name || "",
        template_id,
        template_name || "",
        slot_id || null,
        auditor_id,
        auditor_name || "",
        audit_date,
        audit_time,
        JSON.stringify(answers),
      ]
    );

    res.json({ ok: true, id: result.insertId, message: "Audit saved successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to save audit" });
  }
};

/* ===============================
   GET AUDITS LIST
================================*/

const getAudits = async (req, res) => {
  try {
    const {
      entity_type,
      entity_id,
      auditor_id,
      from_date,
      to_date,
      page = 1,
      limit = 20,
    } = req.query;

    const where = [];
    const params = [];

    if (entity_type) { where.push("entity_type = ?"); params.push(entity_type); }
    if (entity_id)   { where.push("entity_id = ?");   params.push(entity_id);   }
    if (auditor_id)  { where.push("auditor_id = ?");  params.push(auditor_id);  }
    if (from_date)   { where.push("audit_date >= ?"); params.push(from_date);   }
    if (to_date)     { where.push("audit_date <= ?"); params.push(to_date);     }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `SELECT id, entity_type, entity_id, entity_name, template_name,
              auditor_name, audit_date, audit_time, status, created_at
       FROM audits
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM audits ${whereClause}`,
      params
    );

    res.json({ data: { audits: rows, total, page: Number(page), limit: Number(limit) } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch audits" });
  }
};

/* ===============================
   GET AUDIT BY ID
================================*/

const getAuditById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM audits WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Audit not found" });
    }

    res.json({ data: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch audit" });
  }
};

module.exports = { getAuditConfig, saveAudit, getAudits, getAuditById };