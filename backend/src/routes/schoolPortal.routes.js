const express = require("express");
const {
  getSchoolDashboard,
  getSchoolPackets,
  getSchoolOrders,
  createSchoolOrder,
} = require("../controllers/schoolPortal.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("SCHOOL_HEAD"));

router.get("/dashboard", getSchoolDashboard);
router.get("/packets", getSchoolPackets);
router.get("/orders", getSchoolOrders);
router.post("/orders", createSchoolOrder);

module.exports = router;