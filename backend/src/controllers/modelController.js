const ModelMaster = require('../models/modelMaster');

class ModelController {

  static async getAll(req, res) {

    const rows = await ModelMaster.getAll();

    res.json({
      success: true,
      data: rows
    });
  }


  static async getByBrand(req, res) {

    const rows = await ModelMaster.getByBrand(
      req.params.brandId
    );

    res.json({
      success: true,
      data: rows
    });
  }


  static async create(req, res) {

    const { brand_id, name, status } = req.body;

    if (!brand_id || !name) {
      return res.status(400).json({
        success: false,
        message: "Brand and name required"
      });
    }

    await ModelMaster.create(
      brand_id,
      name,
      status
    );

    res.json({
      success: true,
      message: "Model created"
    });
  }


  static async update(req, res) {

    const { brand_id, name, status } = req.body;

    await ModelMaster.update(
      req.params.id,
      brand_id,
      name,
      status
    );

    res.json({
      success: true,
      message: "Model updated"
    });
  }


  static async delete(req, res) {

    await ModelMaster.delete(req.params.id);

    res.json({
      success: true,
      message: "Model deleted"
    });
  }
}

module.exports = ModelController;