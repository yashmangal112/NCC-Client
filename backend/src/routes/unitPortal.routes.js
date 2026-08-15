const express = require("express");
const {
  getUnitDashboard,
  getUnitSchools,
  getUnitPackets,
  getUnitOrders,
  createUnitOrder,
} = require("../controllers/unitPortal.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("UNIT_OFFICER"));

router.get("/dashboard", getUnitDashboard);
router.get("/schools", getUnitSchools);
router.get("/packets", getUnitPackets);
router.get("/orders", getUnitOrders);
router.post("/orders", createUnitOrder);

module.exports = router;