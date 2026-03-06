const db = require('../config/db');

class Line {

  // Create
  static async create(name, status = 'active') {

    const sql = `
      INSERT INTO \`lines\` (name, status)
      VALUES (?, ?)
    `;

    return db.execute(sql, [name, status]);
  }


  // Get All
  static async getAll() {

    const sql = `
      SELECT *
      FROM \`lines\`
      ORDER BY id DESC
    `;

    return db.execute(sql);
  }


  // Get By ID
  static async getById(id) {

    const sql = `
      SELECT *
      FROM \`lines\`
      WHERE id = ?
    `;

    const rows = await db.execute(sql, [id]);

    return rows[0] || null;
  }


  // Update
  static async update(id, name, status) {

    const set = [];
    const params = [];

    if (name !== undefined) {
      set.push('name = ?');
      params.push(name);
    }

    if (status !== undefined) {
      set.push('status = ?');
      params.push(status);
    }

    if (!set.length) return;

    const sql = `
      UPDATE \`lines\`
      SET ${set.join(', ')}
      WHERE id = ?
    `;

    params.push(id);

    return db.execute(sql, params);
  }


  // Change Status
  static async changeStatus(id, status) {

    const sql = `
      UPDATE \`lines\`
      SET status = ?
      WHERE id = ?
    `;

    return db.execute(sql, [status, id]);
  }


  // Hard Delete
  static async hardDelete(id) {

    const sql = `
      DELETE FROM \`lines\`
      WHERE id = ?
    `;

    return db.execute(sql, [id]);
  }

}

module.exports = Line;