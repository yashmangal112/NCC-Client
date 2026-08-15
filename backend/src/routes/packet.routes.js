const express = require("express");
const {
  getPackets,
  getPacketById,
  createPacket,
  updatePacket,
  archivePacket,
  reactivatePacket,
} = require("../controllers/packet.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/packets
router.get("/", getPackets);

// GET /api/admin/packets/:id
router.get("/:id", getPacketById);

// POST /api/admin/packets
router.post("/", createPacket);

// PUT /api/admin/packets/:id
router.put("/:id", updatePacket);

// DELETE /api/admin/packets/:id
router.delete("/:id", archivePacket);

// PATCH /api/admin/packets/:id/reactivate
router.patch("/:id/reactivate", reactivatePacket);

module.exports = router;
