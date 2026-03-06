const Station = require('../models/stationModel');

class StationController {

  // Get All
  static async getAll(req, res) {

    try {

      const rows = await Station.getAll();

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

      const station = await Station.getById(req.params.id);

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Station not found'
        });
      }

      res.json({
        success: true,
        data: station
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

      await Station.create(name, status);

      res.json({
        success: true,
        message: 'Station created'
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

      await Station.update(
        req.params.id,
        name,
        status
      );

      res.json({
        success: true,
        message: 'Station updated'
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

      if (!['active','inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      await Station.changeStatus(
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

      await Station.hardDelete(req.params.id);

      res.json({
        success: true,
        message: 'Station deleted'
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

}

module.exports = StationController;