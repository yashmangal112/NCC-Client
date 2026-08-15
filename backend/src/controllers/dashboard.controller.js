const prisma = require("../lib/prisma");
const { success } = require("../utils/response");

async function getAdminDashboardStats(req, res, next) {
  try {
    const [pendingOrdersCount, deliveredThisWeekCount, activePacketsCount, settledOrders, recentOrders] =
      await Promise.all([
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.packet.count({ where: { isArchived: false } }),
        prisma.order.aggregate({
          where: { status: "DELIVERED" },
          _sum: { totalAmount: true },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            school: { select: { name: true, code: true } },
            unit: { select: { name: true } },
            orderItems: { include: { packet: { select: { id: true, packetCode: true, name: true } } } },          },
        }),
      ]);

    const revenueSettledAmount = settledOrders._sum.totalAmount || 0;
    const mappedRecent = recentOrders.map((o) => {
      let packetName = o.packet?.name || o.packetName;
      if (!packetName && Array.isArray(o.items) && o.items.length > 0) {
        packetName = o.items.map((i) => `${i.quantity || 1}x ${i.packet?.name || i.name}`).join(", ");
      }
      if (!packetName) packetName = "Refreshment Packet";
      return {
        id: o.orderNumber || o.id,
        school: o.school?.name || "Direct Unit Order",
        unit: o.unit?.name || "4 Delhi BN NCC",
        deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString().slice(0, 10) : "TBD",
        totalAmount: o.totalAmount || o.amount || 0,
        totalQty: o.totalQty || o.quantity || 0,
        packetName,
        status: o.status,
      };
    });

    return res.json({
      success: true,
      data: {
        pendingOrdersCount,
        deliveredThisWeekCount,
        revenueSettledAmount,
        activePacketsCount,
        recentOrders: mappedRecent,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAdminDashboardStats };