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

      await Line.create(name, status);

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

      await Line.update(
        req.params.id,
        name,
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

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      await Line.changeStatus(
        req.params.id,
        status
      );

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

      await Line.hardDelete(req.params.id);

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