const express = require("express");
const router = express.Router();
const controller = require("../controllers/templateSubmissionController");

router.post("/", controller.create);
router.get("/:template_id", controller.getByTemplate);

module.exports = router;