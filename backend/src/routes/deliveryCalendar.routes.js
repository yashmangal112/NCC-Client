const express = require("express");
const { getDeliveryCalendar } = require("../controllers/deliveryCalendar.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN", "UNIT_OFFICER"));

// GET /api/admin/delivery-calendar
router.get("/", getDeliveryCalendar);

module.exports = router;
