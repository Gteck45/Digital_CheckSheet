const db = require('../config/db');

class Brand {

  static create(name, status = "active") {
    return db.execute(
      `INSERT INTO brands (name, status)
       VALUES (?, ?)`,
      [name, status]
    );
  }

  static getAll() {
    return db.execute(
      `SELECT *
       FROM brands
       ORDER BY id DESC`
    );
  }

  static update(id, name, status) {
    return db.execute(
      `UPDATE brands
       SET name = ?, status = ?
       WHERE id = ?`,
      [name, status, id]
    );
  }

  static delete(id) {
    return db.execute(
      `DELETE FROM brands WHERE id = ?`,
      [id]
    );
  }
}

module.exports = Brand;