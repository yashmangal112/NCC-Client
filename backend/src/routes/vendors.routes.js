const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getVendors, createVendor, updateVendor, deleteVendor } = require("../controllers/vendors.controller");


router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/vendors
router.get("/", getVendors);

// POST /api/admin/vendors
router.post("/", createVendor);

// PUT /api/admin/vendors/:id
router.put("/:id", updateVendor);

// DELETE /api/admin/vendors/:id
router.delete("/:id", deleteVendor);

module.exports = router;