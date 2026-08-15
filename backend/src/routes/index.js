const express = require("express");

const authRoutes = require("./auth.routes");

const dashboardRoutes = require("./dashboard.routes");
const skuRoutes = require("./sku.routes");
const packetRoutes = require("./packet.routes");
const packetRequestRoutes = require("./packetRequest.routes");
const unitRoutes = require("./unit.routes");
const schoolRoutes = require("./school.routes");
const orderRoutes = require("./order.routes");
const deliveryCalendarRoutes = require("./deliveryCalendar.routes");
const reportRoutes = require("./report.routes");
const deliveryPersonRoutes = require("./deliveryPerson.routes");
const vendorsRoutes = require("./vendors.routes");

const unitPortalRoutes = require("./unitPortal.routes");
const schoolPortalRoutes = require("./schoolPortal.routes");
const deliveryRoutes = require("./delivery.routes")

const router = express.Router();

// /api/auth/*
router.use("/auth", authRoutes);

// /api/admin/*
router.use("/admin/skus", skuRoutes);
router.use("/admin/packets", packetRoutes);
router.use("/admin/packet-requests", packetRequestRoutes);
router.use("/admin/units", unitRoutes);
router.use("/admin/schools", schoolRoutes);
router.use("/admin/orders", orderRoutes);
router.use("/admin/delivery-calendar", deliveryCalendarRoutes);
router.use("/admin/reports", reportRoutes);
router.use("/admin/dashboard", dashboardRoutes);
router.use("/admin/delivery-persons", deliveryPersonRoutes);
router.use("/admin/vendors", vendorsRoutes);

router.use("/unit", unitPortalRoutes);
router.use("/school-admin", schoolPortalRoutes);
router.use("/delivery", deliveryRoutes);

module.exports = router;
