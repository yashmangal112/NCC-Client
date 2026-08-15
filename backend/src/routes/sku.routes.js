const express = require("express");
const { getSkus, getSkuById, createSku, updateSku, archiveSku } = require("../controllers/sku.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/skus
router.get("/", getSkus);

// GET /api/admin/skus/:id
router.get("/:id", getSkuById);

// POST /api/admin/skus
router.post("/", createSku);

// PUT /api/admin/skus/:id
router.put("/:id", updateSku);

// DELETE /api/admin/skus/:id
router.delete("/:id", archiveSku);

module.exports = router;
