const express = require("express");
const { getUnits, getUnitById, createUnit, updateUnit } = require("../controllers/unit.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/units
router.get("/", getUnits);

// GET /api/admin/units/:id
router.get("/:id", getUnitById);

// POST /api/admin/units
router.post("/", createUnit);

// PUT /api/admin/units/:id
router.put("/:id", updateUnit);

module.exports = router;
