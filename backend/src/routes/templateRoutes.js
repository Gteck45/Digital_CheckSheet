const express = require("express");
const router = express.Router();
const controller = require("../controllers/templateController");

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);

router.patch("/:id/soft-delete", controller.softDelete);
router.patch("/:id/restore", controller.restore);
router.delete("/:id/hard-delete", controller.hardDelete);

module.exports = router;