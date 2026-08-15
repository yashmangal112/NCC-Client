const express = require("express");
const { getSchools, getSchoolById, createSchool, updateSchool } = require("../controllers/school.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/schools
router.get("/", getSchools);

// GET /api/admin/schools/:id
router.get("/:id", getSchoolById);

// POST /api/admin/schools
router.post("/", createSchool);

// PUT /api/admin/schools/:id
router.put("/:id", updateSchool);

module.exports = router;
