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

      // Check if station with same name already exists
      const existingStation = await Station.getByName(name.trim());
      if (existingStation) {
        return res.status(409).json({
          success: false,
          message: 'Station with this name already exists'
        });
      }

      await Station.create(name.trim(), status);

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
        const existingStation = await Station.getByName(name.trim());
        if (existingStation && existingStation.id != id) {
          return res.status(409).json({
            success: false,
            message: 'Station with this name already exists'
          });
        }
      }

      await Station.update(
        id,
        name ? name.trim() : undefined,
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
      const { id } = req.params;

      if (!['active','inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Check if station exists
      const station = await Station.getById(id);
      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Station not found'
        });
      }

      await Station.changeStatus(id, status);

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

      // Check if station exists
      const station = await Station.getById(id);
      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Station not found'
        });
      }

      await Station.hardDelete(id);

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