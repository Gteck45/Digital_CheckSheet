const db = require("../config/db");

class Submission {

  static async create(data) {
    const q = `
      INSERT INTO template_submissions
      (template_id, submitted_by, response_json)
      VALUES (?, ?, ?)
    `;
    return db.execute(q, [
      data.template_id,
      data.submitted_by,
      JSON.stringify(data.response_json)
    ]);
  }

  static async getByTemplate(template_id) {
    return db.execute(
      `SELECT * FROM template_submissions WHERE template_id = ?`,
      [template_id]
    );
  }

}

module.exports = Submission;