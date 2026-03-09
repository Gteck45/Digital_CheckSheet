const Brand = require('../models/brandModel');

class BrandController {

  static async getAll(req, res) {

    try {

      const rows = await Brand.getAll();

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


  static async getOne(req, res) {

    try {

      const rows = await Brand.getById(req.params.id);
      const brand = rows[0];

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      res.json({
        success: true,
        data: brand
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  static async create(req, res) {

    try {

      const { name, status } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Brand name required"
        });
      }

      // Check if brand with same name already exists
      const existingRows = await Brand.getByName(name.trim());
      if (existingRows[0]) {
        return res.status(409).json({
          success: false,
          message: 'Brand with this name already exists'
        });
      }

      await Brand.create(name.trim(), status);

      res.json({
        success: true,
        message: "Brand created"
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


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
        const existingRows = await Brand.getByName(name.trim());
        if (existingRows[0] && existingRows[0].id != id) {
          return res.status(409).json({
            success: false,
            message: 'Brand with this name already exists'
          });
        }
      }

      await Brand.update(
        id,
        name ? name.trim() : undefined,
        status
      );

      res.json({
        success: true,
        message: "Brand updated"
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  static async delete(req, res) {

    try {

      const { id } = req.params;

      // Check if brand exists
      const rows = await Brand.getById(id);
      if (!rows[0]) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      await Brand.delete(id);

      res.json({
        success: true,
        message: "Brand deleted"
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = BrandController;