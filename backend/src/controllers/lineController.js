const Line = require('../models/lineModel');

class LineController {

  // Get All
  static async getAll(req, res) {

    try {

      const rows = await Line.getAll();

      res.json({
        success: true,
        data: rows
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  // Get One
  static async getOne(req, res) {

    try {

      const line = await Line.getById(req.params.id);

      if (!line) {
        return res.status(404).json({
          success: false,
          message: 'Line not found'
        });
      }

      res.json({
        success: true,
        data: line
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  // Create
  static async create(req, res) {

    try {

      const { name, status } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name required'
        });
      }

      // Check if line with same name already exists
      const existingLine = await Line.getByName(name.trim());
      if (existingLine) {
        return res.status(409).json({
          success: false,
          message: 'Line with this name already exists'
        });
      }

      await Line.create(name.trim(), status);

      res.json({
        success: true,
        message: 'Line created'
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  // Update
  static async update(req, res) {

    try {

      const { name, status } = req.body;
      const { id } = req.params;

      // Validate input
      if (!name && status === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name or status) is required'
        });
      }

      // If name is being updated, check for duplicates
      if (name) {
        const existingLine = await Line.getByName(name.trim());
        if (existingLine && existingLine.id != id) {
          return res.status(409).json({
            success: false,
            message: 'Line with this name already exists'
          });
        }
      }

      await Line.update(
        id,
        name ? name.trim() : undefined,
        status
      );

      res.json({
        success: true,
        message: 'Line updated'
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  // Change Status
  static async changeStatus(req, res) {

    try {

      const { status } = req.body;
      const { id } = req.params;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Check if line exists
      const line = await Line.getById(id);
      if (!line) {
        return res.status(404).json({
          success: false,
          message: 'Line not found'
        });
      }

      await Line.changeStatus(id, status);

      res.json({
        success: true,
        message: 'Status updated'
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  // Delete
  static async hardDelete(req, res) {

    try {

      const { id } = req.params;

      // Check if line exists
      const line = await Line.getById(id);
      if (!line) {
        return res.status(404).json({
          success: false,
          message: 'Line not found'
        });
      }

      await Line.hardDelete(id);

      res.json({
        success: true,
        message: 'Line deleted'
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

}

module.exports = LineController;