const express = require("express");
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  uploadPaymentProof,
  verifyPayment,
  assignOrderDelivery,
  markPaymentComplete,
  bulkImportLegacyOrders,
} = require("../controllers/order.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/admin/orders
router.get("/", authorize("SUPER_ADMIN", "UNIT_OFFICER"), getOrders);

// GET /api/admin/orders/:id
router.get("/:id", authorize("SUPER_ADMIN", "UNIT_OFFICER", "SCHOOL_HEAD"), getOrderById);

// POST /api/admin/orders
router.post("/", authorize("SUPER_ADMIN", "UNIT_OFFICER"), createOrder);

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", authorize("SUPER_ADMIN", "UNIT_OFFICER"), updateOrderStatus);

// POST /api/admin/orders/:id/payment-proof  (uploaded by the School Head)
router.post("/:id/payment-proof", authorize("SCHOOL_HEAD", "SUPER_ADMIN"), uploadPaymentProof);

// PATCH /api/admin/orders/:id/verify-payment
router.patch("/:id/verify-payment", authorize("SUPER_ADMIN"), verifyPayment);

// PATCH /api/admin/orders/:id/assign-delivery
router.patch("/:id/assign-delivery", authorize("SUPER_ADMIN"), assignOrderDelivery);

// PATCH /api/admin/orders/:id/payment
router.patch("/:id/payment", authorize("SUPER_ADMIN"), markPaymentComplete);

router.post("/bulk-import", authorize("SUPER_ADMIN"), bulkImportLegacyOrders);

module.exports = router;
