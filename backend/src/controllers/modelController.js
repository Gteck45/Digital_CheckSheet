const ModelMaster = require('../models/modelMaster');

class ModelController {

  static async getAll(req, res) {

    try {

      const rows = await ModelMaster.getAll();

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

      const rows = await ModelMaster.getById(req.params.id);
      const model = rows[0];

      if (!model) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }

      res.json({
        success: true,
        data: model
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }


  static async getByBrand(req, res) {

    try {

      const rows = await ModelMaster.getByBrand(
        req.params.brandId
      );

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


  static async create(req, res) {

    try {

      const { brand_id, name, status } = req.body;

      if (!brand_id || !name) {
        return res.status(400).json({
          success: false,
          message: "Brand and name required"
        });
      }

      // Check if model with same name already exists for this brand
      const existingRows = await ModelMaster.getByName(name.trim());
      const existingModel = existingRows.find(model => model.brand_id == brand_id);

      if (existingModel) {
        return res.status(409).json({
          success: false,
          message: 'Model with this name already exists for this brand'
        });
      }

      await ModelMaster.create(
        brand_id,
        name.trim(),
        status
      );

      res.json({
        success: true,
        message: "Model created"
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

      const { brand_id, name, status } = req.body;
      const { id } = req.params;

      // Validate input
      if ((!brand_id && !name) && status === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (brand_id, name or status) is required'
        });
      }

      // If name is being updated, check for duplicates within the same brand
      if (name && brand_id) {
        const existingRows = await ModelMaster.getByName(name.trim());
        const existingModel = existingRows.find(model =>
          model.brand_id == brand_id && model.id != id
        );

        if (existingModel) {
          return res.status(409).json({
            success: false,
            message: 'Model with this name already exists for this brand'
          });
        }
      }

      await ModelMaster.update(
        id,
        brand_id,
        name ? name.trim() : undefined,
        status
      );

      res.json({
        success: true,
        message: "Model updated"
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

      // Check if model exists
      const rows = await ModelMaster.getById(id);
      if (!rows[0]) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }

      await ModelMaster.delete(id);

      res.json({
        success: true,
        message: "Model deleted"
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = ModelController;