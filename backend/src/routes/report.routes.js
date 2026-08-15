const express = require("express");
const router = express.Router();
const { getReports, exportCsv, exportPdf } = require("../controllers/report.controller");
const { authorize, authenticate } = require("../middleware/auth.middleware");

router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/reports
router.get("/", getReports);

// GET /api/admin/reports/export-csv
router.get("/export-csv", exportCsv);

// GET /api/admin/reports/export-pdf
router.get("/export-pdf", exportPdf);

module.exports = router;