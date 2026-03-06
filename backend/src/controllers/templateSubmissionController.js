const Submission = require("../models/templateSubmissionModel");

exports.create = async (req, res) => {
  await Submission.create(req.body);
  res.json({ ok: true, message: "Submitted successfully" });
};

exports.getByTemplate = async (req, res) => {
  const [rows] = await Submission.getByTemplate(req.params.template_id);
  res.json(rows);
};