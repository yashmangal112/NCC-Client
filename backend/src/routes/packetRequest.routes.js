const express = require("express");
const {
  getPacketRequests,
  createPacketRequest,
  fulfillPacketRequest,
  declinePacketRequest,
} = require("../controllers/packetRequest.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/admin/packet-requests  (admin queue view)
router.get("/", authorize("SUPER_ADMIN"), getPacketRequests);

// POST /api/admin/packet-requests  (submitted by a school head)
router.post("/", authorize("SCHOOL_HEAD", "SUPER_ADMIN"), createPacketRequest);

// POST /api/admin/packet-requests/:id/fulfill
router.post("/:id/fulfill", authorize("SUPER_ADMIN"), fulfillPacketRequest);

// POST /api/admin/packet-requests/:id/decline
router.post("/:id/decline", authorize("SUPER_ADMIN"), declinePacketRequest);

module.exports = router;
