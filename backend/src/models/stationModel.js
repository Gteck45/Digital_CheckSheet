const db = require('../config/db');

class Station {

  // Create
  static async create(name, status = 'active') {

    const sql = `
      INSERT INTO \`stations\` (name, status)
      VALUES (?, ?)
    `;

    return db.execute(sql, [name.trim(), status]);
  }


  // Get All
  static async getAll() {

    const sql = `
      SELECT *
      FROM \`stations\`
      ORDER BY id DESC
    `;

    return db.execute(sql);
  }


  // Get By ID
  static async getById(id) {

    const sql = `
      SELECT *
      FROM \`stations\`
      WHERE id = ?
    `;

    const rows = await db.execute(sql, [id]);

    return rows[0] || null;
  }


  // Get By Name
  static async getByName(name) {

    const sql = `
      SELECT *
      FROM \`stations\`
      WHERE name = ?
    `;

    const rows = await db.execute(sql, [name]);

    return rows[0] || null;
  }


  // Update
  static async update(id, name, status) {

    const set = [];
    const params = [];

    if (name !== undefined) {
      set.push('name = ?');
      params.push(name.trim());
    }

    if (status !== undefined) {
      set.push('status = ?');
      params.push(status);
    }

    if (!set.length) return;

    const sql = `
      UPDATE \`stations\`
      SET ${set.join(', ')}
      WHERE id = ?
    `;

    params.push(id);

    return db.execute(sql, params);
  }


  // Change Status
  static async changeStatus(id, status) {

    const sql = `
      UPDATE \`stations\`
      SET status = ?
      WHERE id = ?
    `;

    return db.execute(sql, [status, id]);
  }


  // Hard Delete
  static async hardDelete(id) {

    const sql = `
      DELETE FROM \`stations\`
      WHERE id = ?
    `;

    return db.execute(sql, [id]);
  }

}

module.exports = Station;