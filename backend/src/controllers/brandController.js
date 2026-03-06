const Brand = require('../models/brandModel');

class BrandController {

  static async getAll(req, res) {

    const rows = await Brand.getAll();

    res.json({
      success: true,
      data: rows
    });
  }


  static async create(req, res) {

    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name required"
      });
    }

    await Brand.create(name, status);

    res.json({
      success: true,
      message: "Brand created"
    });
  }


  static async update(req, res) {

    const { name, status } = req.body;

    await Brand.update(
      req.params.id,
      name,
      status
    );

    res.json({
      success: true,
      message: "Brand updated"
    });
  }


  static async delete(req, res) {

    await Brand.delete(req.params.id);

    res.json({
      success: true,
      message: "Brand deleted"
    });
  }
}

module.exports = BrandController;