const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateOrderNumber } = require("../utils/generateCode");

function capitalize(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function requireSchoolId(req, res) {
  const schoolId = req.user.schoolId;
  if (!schoolId) {
    error(res, { statusCode: 403, code: "NO_SCHOOL_MAPPED", message: "This account is not linked to a School." });
    return null;
  }
  return schoolId;
}

// GET /api/school-admin/dashboard
async function getSchoolDashboard(req, res, next) {
  try {
    const schoolId = requireSchoolId(req, res);
    if (!schoolId) return;

    const [allocations, totalOrders, revenueAgg, recentOrders] = await Promise.all([
      prisma.schoolUnitAllocation.findMany({ where: { schoolId } }),
      prisma.order.count({ where: { schoolId } }),
      prisma.order.aggregate({ where: { schoolId }, _sum: { totalAmount: true } }),
      prisma.order.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { orderItems: { include: { packet: true } } },
      }),
    ]);

    const enrolledCadets = allocations.reduce((sum, a) => sum + a.studentCount, 0);

    return success(res, {
      data: {
        enrolledCadets,
        totalOrders,
        totalSpent: Math.round((revenueAgg._sum.totalAmount || 0) * 100) / 100,
        recentOrders: recentOrders.map((o) => ({
          id: o.orderNumber,
          orderCode: o.orderNumber,
          packetName: o.orderItems[0]?.packet?.name || "—",
          deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
          qty: o.totalQty,
          amount: o.totalAmount,
          status: capitalize(o.status),
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/school-admin/packets
async function getSchoolPackets(req, res, next) {
  try {
    const schoolId = requireSchoolId(req, res);
    if (!schoolId) return;

    const allocations = await prisma.schoolUnitAllocation.findMany({ where: { schoolId } });
    const unitIds = allocations.map((a) => a.unitId);

    const packetAllocations = await prisma.packetUnitAllocation.findMany({
      where: { unitId: { in: unitIds } },
      include: { packet: { include: { childSkus: { include: { sku: true } } } } },
    });

    const seen = new Set();
    const data = [];
    for (const a of packetAllocations) {
      if (a.packet.isArchived || seen.has(a.packet.id)) continue;
      seen.add(a.packet.id);
      data.push({
        id: a.packet.id,
        name: a.packet.name,
        description: a.packet.description || "",
        itemCount: a.packet.childSkus.length,
        unitPrice: a.packet.sellingPrice,
        itemsList: a.packet.childSkus.map((ps) => ps.sku.name),
        icon: "local_cafe",
      });
    }

    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

// GET /api/school-admin/orders
async function getSchoolOrders(req, res, next) {
  try {
    const schoolId = requireSchoolId(req, res);
    if (!schoolId) return;

    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = { schoolId };
    if (status) where.status = status.toUpperCase();

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { orderItems: { include: { packet: true } }, unit: true },
      }),
      prisma.order.count({ where }),
    ]);

    return success(res, {
      data: orders.map((o) => ({
        id: o.orderNumber,
        orderCode: o.orderNumber,
        unitName: o.unit.name,
        packetName: o.orderItems[0]?.packet?.name || "—",
        deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
        location: o.deliveryLocation,
        qty: o.totalQty,
        amount: o.totalAmount,
        status: capitalize(o.status),
      })),
      meta: buildMeta({ page, limit, total }),
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/school-admin/orders
async function createSchoolOrder(req, res, next) {
  try {
    const schoolId = requireSchoolId(req, res);
    if (!schoolId) return;

    let { unitId, packetId, quantity, deliveryDate, location } = req.body;
    // Validate essential required fields (unitId is optional now!)
    if (!packetId || !quantity || !deliveryDate || !location) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "packetId, quantity, deliveryDate, and location are required.",
      });
    }
    let allocation = null;

    if (!unitId) {
      allocation = await prisma.schoolUnitAllocation.findFirst({
        where: { schoolId },
        include: { unit: true },
      });
      if (!allocation) {
        return error(res, {
          statusCode: 403,
          code: "UNIT_NOT_MAPPED",
          message: "Your school is not mapped to any Command Unit.",
        });
      }
      unitId = allocation.unitId;
    } else {
      // IF unitId WAS PROVIDED, VERIFY MAPPING EXISTS
      allocation = await prisma.schoolUnitAllocation.findUnique({
        where: { schoolId_unitId: { schoolId, unitId } },
        include: { unit: true },
      });
      if (!allocation) {
        return error(res, {
          statusCode: 403,
          code: "UNIT_NOT_MAPPED",
          message: "Your school is not mapped under this Unit.",
        });
      }
    }
    // Verify Packet Existence
    const packet = await prisma.packet.findUnique({ where: { id: packetId } });
    if (!packet) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Packet not found." });
    }
    const totalQty = Number(quantity);
    const unitPrice = packet.sellingPrice || packet.unitPrice || packet.totalCostPrice || 45.0;
    const totalAmount = Math.round(unitPrice * totalQty * 100) / 100;
    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        schoolId,
        unitId,
        deliveryDate: new Date(deliveryDate),
        deliveryLocation: location,
        officerInCharge: allocation?.unit.spocName,
        totalQty,
        totalAmount,
        orderItems: { create: [{ packetId, quantity: totalQty, unitRate: packet.sellingPrice, subtotal: totalAmount }] },
      },
    });

    return success(res, {
      statusCode: 201,
      data: {
        id: order.orderNumber,
        orderCode: order.orderNumber,
        packetName: packet.name,
        location: order.deliveryLocation,
        deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
        qty: order.totalQty,
        amount: order.totalAmount,
        status: capitalize(order.status),
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSchoolDashboard,
  getSchoolPackets,
  getSchoolOrders,
  createSchoolOrder,
};