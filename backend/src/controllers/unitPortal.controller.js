const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateOrderNumber } = require("../utils/generateCode");

function capitalize(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function getMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

function getWeekRange(date = new Date()) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

function requireUnitId(req, res) {
  const unitId = req.user.unitId;
  if (!unitId) {
    error(res, { statusCode: 403, code: "NO_UNIT_MAPPED", message: "This account is not linked to a Unit." });
    return null;
  }
  return unitId;
}

// GET /api/unit/dashboard
async function getUnitDashboard(req, res, next) {
  try {
    const unitId = requireUnitId(req, res);
    if (!unitId) return;

    const { start: monthStart, end: monthEnd } = getMonthRange();
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const [schoolsCount, ordersThisMonth, deliveriesThisWeek, recentOrders] = await Promise.all([
      prisma.schoolUnitAllocation.count({ where: { unitId } }),
      prisma.order.count({ where: { unitId, createdAt: { gte: monthStart, lt: monthEnd } } }),
      prisma.order.count({ where: { unitId, deliveryDate: { gte: weekStart, lt: weekEnd } } }),
      prisma.order.findMany({
        where: { unitId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { school: true },
      }),
    ]);

    return success(res, {
      data: {
        schoolsCount,
        ordersThisMonth,
        deliveriesThisWeek,
        recentOrders: recentOrders.map((o) => ({
          id: o.orderNumber,
          orderCode: o.orderNumber,
          schoolName: o.school.name,
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

// GET /api/unit/schools
async function getUnitSchools(req, res, next) {
  try {
    const unitId = requireUnitId(req, res);
    if (!unitId) return;

    const allocations = await prisma.schoolUnitAllocation.findMany({
      where: { unitId },
      include: { school: true },
    });

    const data = await Promise.all(
      allocations.map(async (a) => {
        const [lifetimeOrders, revenueAgg] = await Promise.all([
          prisma.order.count({ where: { unitId, schoolId: a.schoolId } }),
          prisma.order.aggregate({ where: { unitId, schoolId: a.schoolId }, _sum: { totalAmount: true } }),
        ]);

        return {
          id: a.school.id,
          code: a.school.code,
          name: a.school.name,
          address: a.school.address,
          cadetCount: a.studentCount,
          principalName: a.school.headName,
          principalEmail: a.school.headEmail,
          principalPhone: a.school.headPhone,
          lifetimeOrders,
          lifetimeRevenue: Math.round((revenueAgg._sum.totalAmount || 0) * 100) / 100,
        };
      })
    );

    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

// GET /api/unit/packets
async function getUnitPackets(req, res, next) {
  try {
    const unitId = requireUnitId(req, res);
    if (!unitId) return;

    const allocations = await prisma.packetUnitAllocation.findMany({
      where: { unitId },
      include: { packet: { include: { childSkus: { include: { sku: true } } } } },
      orderBy: { packet: { createdAt: "desc" } },
    });

    const data = allocations
      .filter((a) => !a.packet.isArchived)
      .map((a) => ({
        id: a.packet.id,
        name: a.packet.name,
        description: a.packet.description || "",
        itemCount: a.packet.childSkus.length,
        unitPrice: a.packet.sellingPrice,
        itemsList: a.packet.childSkus.map((ps) => ps.sku.name),
        icon: "local_cafe",
      }));

    return success(res, { data });

  } catch (err) {
    return next(err);
  }
}

// GET /api/unit/orders
// GET /api/unit/orders
async function getUnitOrders(req, res, next) {
  try {
    const unitId = requireUnitId(req, res);
    if (!unitId) return;

    const { status, school } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = { unitId };
    if (status) where.status = status.toUpperCase();
    if (school) where.school = { name: school };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          school: true,
          orderItems: {
            include: {
              packet: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return success(res, {
      data: orders.map((o) => {
        // Extract packet name(s) from orderItems
        const packetNames =
          o.orderItems && o.orderItems.length > 0
            ? o.orderItems.map((item) => item.packet?.name).filter(Boolean).join(", ")
            : "Refreshment Packet";

        return {
          id: o.orderNumber,
          orderCode: o.orderNumber,
          schoolName: o.school ? o.school.name : "Mapped School",
          packetName: packetNames,
          deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
          location: o.deliveryLocation,
          qty: o.totalQty,
          amount: o.totalAmount,
          status: capitalize(o.status),
        };
      }),
      meta: buildMeta({ page, limit, total }),
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/unit/orders
async function createUnitOrder(req, res, next) {
  try {
    const unitId = requireUnitId(req, res);
    if (!unitId) return;

    // Supports single order OR array of school delivery rows
    const deliveries = Array.isArray(req.body.deliveries) ? req.body.deliveries : [req.body];
    const packetId = req.body.packetId || deliveries[0]?.packetId;

    if (!packetId) {
      return error(res, { statusCode: 400, code: "VALIDATION_ERROR", message: "packetId is required." });
    }

    const [unit, packet] = await Promise.all([
      prisma.unit.findUnique({ where: { id: unitId } }),
      prisma.packet.findUnique({ where: { id: packetId } }),
    ]);

    if (!packet) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Packet not found." });

    const createdOrders = [];

    // Create a separate prisma.order record for each school destination
    for (const item of deliveries) {
      const { schoolId, quantity, deliveryDate, location } = item;
      if (!schoolId || !quantity || !deliveryDate || !location) continue;

      const allocation = await prisma.schoolUnitAllocation.findUnique({
        where: { schoolId_unitId: { schoolId, unitId } },
      });

      if (!allocation) {
        return error(res, { statusCode: 403, code: "SCHOOL_NOT_MAPPED", message: `School ${schoolId} is not mapped under your Unit.` });
      }

      const totalQty = Number(quantity);
      const totalAmount = Math.round(packet.sellingPrice * totalQty * 100) / 100;
      const orderNumber = await generateOrderNumber();
      const parsedDeliveryDate = new Date(`${deliveryDate.slice(0, 10)}T12:00:00.000Z`);

      const order = await prisma.order.create({
        data: {
          orderNumber,
          schoolId,
          unitId,
          deliveryDate: parsedDeliveryDate,
          deliveryLocation: location,
          officerInCharge: unit.spocName,
          totalQty,
          totalAmount,
          orderItems: {
            create: [{ packetId, quantity: totalQty, unitRate: packet.sellingPrice, subtotal: totalAmount }],
          },
        },
      });

      createdOrders.push({
        id: order.orderNumber,
        orderCode: order.orderNumber,
        packetName: packet.name,
        deliveryLocation: order.deliveryLocation,
        deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
        qty: order.totalQty,
        status: capitalize(order.status),
      });
    }

    return success(res, {
      statusCode: 201,
      message: `Created ${createdOrders.length} separate requisition order(s).`,
      data: createdOrders.length === 1 ? createdOrders[0] : createdOrders,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getUnitDashboard,
  getUnitSchools,
  getUnitPackets,
  getUnitOrders,
  createUnitOrder,
};