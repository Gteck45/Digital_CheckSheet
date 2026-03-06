const db = require('../config/db');

class ModelMaster {

  static create(brand_id, name, status = "active") {

    return db.execute(
      `INSERT INTO models (brand_id, name, status)
       VALUES (?, ?, ?)`,
      [brand_id, name, status]
    );
  }

  static getAll() {

    return db.execute(`
      SELECT 
        m.*,
        b.name AS brand_name
      FROM models m
      JOIN brands b ON b.id = m.brand_id
      ORDER BY m.id DESC
    `);
  }

  static getByBrand(brandId) {

    return db.execute(
      `SELECT *
       FROM models
       WHERE brand_id = ?
       ORDER BY name`,
      [brandId]
    );
  }

  static update(id, brand_id, name, status) {

    return db.execute(
      `UPDATE models
       SET brand_id = ?, name = ?, status = ?
       WHERE id = ?`,
      [brand_id, name, status, id]
    );
  }

  static delete(id) {

    return db.execute(
      `DELETE FROM models WHERE id = ?`,
      [id]
    );
  }
}

module.exports = ModelMaster;