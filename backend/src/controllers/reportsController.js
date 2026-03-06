const db = require('../config/db');

class ReportsController {

  /**
   * GET /api/reports
   * Returns paginated template submissions with entity info.
   * Query params: page, limit, entity_type, entity_id, from_date, to_date, search
   */
  static async list(req, res) {
    try {
      const page   = Math.max(1, Number(req.query.page  || 1));
      const limit  = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const offset = (page - 1) * limit;

      const { entity_type, entity_id, from_date, to_date, search } = req.query;

      // Build WHERE conditions
      const conditions = ['1=1'];
      const params     = [];

      if (entity_type) {
        conditions.push('t.entity_type = ?');
        params.push(entity_type);
      }
      if (entity_id) {
        conditions.push('t.entity_id = ?');
        params.push(Number(entity_id));
      }
      if (from_date) {
        conditions.push('ts.created_at >= ?');
        params.push(from_date);
      }
      if (to_date) {
        conditions.push('ts.created_at <= ?');
        params.push(to_date + ' 23:59:59');
      }
      if (search) {
        conditions.push('(t.name LIKE ? OR u.username LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      const where = conditions.join(' AND ');

      // Count query
      const countSql = `
        SELECT COUNT(*) AS total
        FROM template_submissions ts
        JOIN templates t ON ts.template_id = t.id
        LEFT JOIN users u ON ts.submitted_by = u.id
        WHERE ${where}
      `;
      const countRows = await db.executeQuery(countSql, params);
      const total = countRows[0]?.total ?? 0;

      // Data query — join with lines / stations / models to get entity name
      const dataSql = `
        SELECT
          ts.id,
          ts.template_id,
          ts.response_json,
          ts.created_at,

          t.name        AS template_name,
          t.entity_type,
          t.entity_id,

          COALESCE(
            CASE t.entity_type
              WHEN 'line'    THEN l.name
              WHEN 'station' THEN s.name
              WHEN 'model'   THEN m.name
            END
          , 'Unknown')  AS entity_name,

          u.username    AS submitted_by,
          u.email       AS submitted_by_email

        FROM template_submissions ts
        JOIN templates t ON ts.template_id = t.id
        LEFT JOIN users    u ON ts.submitted_by = u.id
        LEFT JOIN lines    l ON t.entity_type = 'line'    AND l.id = t.entity_id
        LEFT JOIN stations s ON t.entity_type = 'station' AND s.id = t.entity_id
        LEFT JOIN models   m ON t.entity_type = 'model'   AND m.id = t.entity_id
        WHERE ${where}
        ORDER BY ts.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await db.executeQuery(dataSql, [...params, limit, offset]);

      // Parse response_json for each row
      const data = rows.map(row => {
        let parsed = {};
        try { parsed = JSON.parse(row.response_json); } catch (_) {}
        return {
          ...row,
          response_json: parsed,
        };
      });

      res.json({
        success: true,
        data: {
          reports: data,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      console.error('[ReportsController.list]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/reports/summary
   * Returns count by entity_type for KPI cards.
   */
  static async summary(req, res) {
    try {
      const rows = await db.executeQuery(`
        SELECT
          t.entity_type,
          COUNT(ts.id) AS cnt
        FROM template_submissions ts
        JOIN templates t ON ts.template_id = t.id
        GROUP BY t.entity_type
      `);

      const total = await db.executeQuery('SELECT COUNT(*) AS total FROM template_submissions');

      res.json({
        success: true,
        data: {
          total: total[0]?.total ?? 0,
          byEntityType: rows,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ReportsController;
