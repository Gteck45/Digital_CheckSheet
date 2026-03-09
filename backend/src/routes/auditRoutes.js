const express = require("express");
const { getAuditConfig, saveAudit, getAudits, getAuditById } = require("../controllers/auditController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/config", getAuditConfig);
router.post("/", auth, saveAudit);
router.get("/", auth, getAudits);
router.get("/:id", auth, getAuditById);

module.exports = router;