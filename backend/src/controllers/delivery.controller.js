const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");


// GET /api/delivery/my-deliveries
async function getMyDeliveries(req, res, next) {
  try {
    const driverId = req.user.driverId || req.user.id;

    const whereOr = [{ driverId }];
    if (req.user.phone) {
      whereOr.push({ driverPhone: req.user.phone });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: whereOr,
        status: "PENDING",
      },
      orderBy: { deliveryDate: "asc" },
      include: {
        school: true,
        unit: true,
        orderItems: { include: { packet: true } }, // packet -> orderItems.include.packet
      },
    });

    const data = orders.map((o) => ({
      id: o.orderNumber || o.id,
      orderCode: o.orderNumber || `#ORD-${o.id}`,
      school: o.school?.name || "School",
      unit: o.unit?.name || "Command Unit",
      location: o.deliveryLocation || "TBD",
      deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString().slice(0, 10) : "TBD",
      quantity: o.totalQty,
      // an order can have multiple packets via orderItems — join their names, or take the first
      packetName: o.orderItems?.map((oi) => oi.packet?.name).filter(Boolean).join(", ") || "Refreshment Bundle",
      status: o.status,
      contactPerson: o.school?.headName,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

// POST /api/delivery/orders/:id/confirm
async function confirmDelivery(req, res, next) {
  try {
    const orderNumber = decodeURIComponent(req.params.id);
    const { proofFileName, proofUrl, deliveryNote, utrNumber } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: "DELIVERED",
        deliveryStatus: "DELIVERED",
        proofFileName,
        proofUrl: proofUrl || null,
        deliveryNote: deliveryNote || null,
        confirmedAt: new Date(),
      },
    });

    return res.json({ success: true, message: "Delivery confirmed!", data: updatedOrder });
  } catch (err) {
    return next(err);
  }
}

// GET /api/delivery/history
async function getDeliveryHistory(req, res, next) {
  try {
    const driverId = req.user.driverId || req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        OR: [{ driverId }, { driverPhone: req.user.phone }],
        status: "DELIVERED",
      },
      orderBy: { confirmedAt: "desc" },
      include: { school: true, unit: true },
    });

    const data = orders.map((o) => ({
      id: o.orderNumber || o.id,
      orderCode: o.orderNumber || `#ORD-${o.id}`,
      school: o.school?.name || "School",
      unit: o.unit?.name || "Command Unit",
      location: o.deliveryLocation,
      deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString().slice(0, 10) : "TBD",
      confirmedAt: o.confirmedAt ? o.confirmedAt.toLocaleString("en-GB") : "Recently",
      quantity: o.totalQty,
      packetName: "Refreshment Bundle",
      status: "DELIVERED",
      proofFileName: o.proofFileName || "POD_Receipt.pdf",
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMyDeliveries, confirmDelivery, getDeliveryHistory };