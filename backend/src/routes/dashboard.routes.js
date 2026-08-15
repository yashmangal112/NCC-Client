const express = require("express");
const router = express.Router();
const { getAdminDashboardStats } = require("../controllers/dashboard.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");


router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/dashboard
router.get("/", getAdminDashboardStats);

module.exports = router;