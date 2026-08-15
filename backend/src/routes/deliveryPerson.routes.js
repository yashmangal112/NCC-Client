const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getDeliveryPersons, createDeliveryPerson, updateDeliveryPerson, deleteDeliveryPerson } = require("../controllers/deliveryPerson.controller");


router.use(authenticate, authorize("SUPER_ADMIN"));

// GET /api/admin/delivery-persons
router.get("/", getDeliveryPersons);

router.post("/", createDeliveryPerson);

router.put("/:id", updateDeliveryPerson);

router.delete("/:id", deleteDeliveryPerson);

module.exports = router;