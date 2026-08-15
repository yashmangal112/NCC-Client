const prisma = require("../lib/prisma");
const { success, error } = require("../utils/response");

function capitalize(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// GET /api/admin/delivery-calendar
async function getDeliveryCalendar(req, res, next) {
  try {
    const { year, month, unit, school } = req.query;

    if (!year || !month) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "year and month query parameters are required.",
      });
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10); // 1-12

    if (!Number.isInteger(yearNum) || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "year must be a 4-digit number and month must be between 1 and 12.",
      });
    }

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 1)); // exclusive upper bound

    const where = {
      deliveryDate: { gte: startDate, lt: endDate },
    };
    if (unit) where.unit = { name: unit };
    if (school) where.school = { name: school };

    const orders = await prisma.order.findMany({
      where,
      include: { school: true, unit: true },
      orderBy: { deliveryDate: "asc" },
    });

    const data = orders.map((order) => ({
      id: order.orderNumber,
      school: order.school.name,
      unit: order.unit.name,
      dateStr: order.deliveryDate.toISOString().slice(0, 10),
      location: order.deliveryLocation,
      qty: order.totalQty,
      status: capitalize(order.status),
    }));

    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getDeliveryCalendar };
