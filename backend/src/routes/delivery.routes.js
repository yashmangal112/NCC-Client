const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getMyDeliveries, confirmDelivery, getDeliveryHistory } = require("../controllers/delivery.controller");

router.use(authenticate, authorize("DELIVERY_PERSON"));

router.get("/my-deliveries", getMyDeliveries);
router.post("/orders/:id/confirm", confirmDelivery);
router.get("/history", getDeliveryHistory);

module.exports = router;
