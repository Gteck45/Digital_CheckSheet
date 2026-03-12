const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { auth } = require("../middleware/auth");
const { saveAudit, getAudits, getAuditById } = require("../controllers/auditController");

/* IMAGE + DATA */

router.post("/", auth, upload.any(), saveAudit);

router.get("/", auth, getAudits);
router.get("/:id", auth, getAuditById);

module.exports = router;