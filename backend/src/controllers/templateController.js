// src/controllers/templateController.js
const Template = require("../models/templateModel");

const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

exports.create = async (req, res) => {
  try {
    const { name, entity_type, entity_id, schema_json } = req.body || {};
    if (!name || !entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: "name, entity_type, entity_id are required",
      });
    }

    const id = await Template.create({ name, entity_type, entity_id, schema_json });

    return res.status(201).json({
      success: true,
      message: "Template created",
      data: { id },
    });
  } catch (err) {
    console.error("create error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const templates = await Template.getAll();
    return res.json({
      success: true,
      message: "Templates retrieved successfully",
      data: { templates },
    });
  } catch (err) {
    console.error("getAll error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const template = await Template.getById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    return res.json({
      success: true,
      message: "Template retrieved successfully",
      data: template,
    });
  } catch (err) {
    console.error("getById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const { name, schema_json } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }

    const ok = await Template.update(id, { name, schema_json });
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Template not found or already deleted",
      });
    }

    return res.json({ success: true, message: "Updated" });
  } catch (err) {
    console.error("update error:", err);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid ID" });

    const ok = await Template.softDelete(id);
    if (!ok) return res.status(404).json({ success: false, message: "Template not found" });

    return res.json({ success: true, message: "Soft deleted" });
  } catch (err) {
    console.error("softDelete error:", err);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};

exports.restore = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid ID" });

    const ok = await Template.restore(id);
    if (!ok) return res.status(404).json({ success: false, message: "Template not found" });

    return res.json({ success: true, message: "Restored" });
  } catch (err) {
    console.error("restore error:", err);
    return res.status(500).json({ success: false, message: "Restore failed" });
  }
};

exports.hardDelete = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid ID" });

    const ok = await Template.hardDelete(id);
    if (!ok) return res.status(404).json({ success: false, message: "Template not found" });

    return res.json({ success: true, message: "Permanently deleted" });
  } catch (err) {
    console.error("hardDelete error:", err);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};