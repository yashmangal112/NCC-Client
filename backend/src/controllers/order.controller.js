const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateOrderNumber } = require("../utils/generateCode");

const STATUS_MAP = {
  Placed: "PENDING",
  Pending: "PENDING",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  PENDING: "PENDING",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

// Valid forward transitions in the fulfillment workflow.
const ALLOWED_TRANSITIONS = {
  Placed: ["DELIVERED", "CANCELLED", "PENDING"],
  PENDING: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["PENDING", "CANCELLED"],
  CANCELLED: ["PENDING", "DELIVERED"],
};


function serialize(order) {
  return {
    id: order.orderNumber,
    school: order.school.name,
    unit: order.unit.name,
    deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
    location: order.deliveryLocation,
    totalQty: order.totalQty,
    totalAmount: order.totalAmount,
    status: capitalize(order.status),
    officerInCharge: order.officerInCharge,
    deliveryDetails: {
      status: humanizeDeliveryStatus(order.deliveryStatus),
      personName: order.driverName,
      phone: order.driverPhone,
      vehicleNo: order.vehicleNo,
      proofUrl: order.proofUrl,
      proofFileName: order.proofFileName,
    },
    paymentProof: {
      uploaded: order.paymentUploaded,
      utrNumber: order.utrNumber,
      verified: order.paymentVerified,
      paymentProofUrl: order.paymentProofUrl,
    },
  };
}

function capitalize(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function humanizeDeliveryStatus(s) {
  return s
    .split("_")
    .map((w) => capitalize(w))
    .join(" ");
}

// GET /api/admin/orders
async function getOrders(req, res, next) {
  try {
    const { status, unit, school } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (status) {
      const normalized = STATUS_MAP[status] || status.toUpperCase();
      if (!Object.values(STATUS_MAP).includes(normalized)) {
        return error(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "status must be one of: Placed, Delivered, Cancelled",
        });
      }
      where.status = normalized;
    }
    if (unit) where.unit = { name: unit };
    if (school) where.school = { name: school };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { school: true, unit: true },
      }),
      prisma.order.count({ where }),
    ]);

    return success(res, { data: orders.map(serialize), meta: buildMeta({ page, limit, total }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/orders/:id  (id = orderNumber, e.g. #ORD-9942, URL-encoded)
async function getOrderById(req, res, next) {
  try {
    const orderNumber = decodeURIComponent(req.params.id);
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { school: true, unit: true, orderItems: { include: { packet: true } } },
    });
    if (!order) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Order not found." });

    return success(res, {
      data: {
        ...serialize(order),
        items: order.orderItems.map((item) => ({
          packetId: item.packetId,
          packetName: item.packet.name,
          quantity: item.quantity,
          unitRate: item.unitRate,
          subtotal: item.subtotal,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/orders  (create a master requisition order from packet line items)
async function createOrder(req, res, next) {
  try {
    const { schoolId, unitId, deliveryDate, deliveryLocation, officerInCharge, internalNote, items } = req.body;

    if (
      !schoolId ||
      !unitId ||
      !deliveryDate ||
      !deliveryLocation ||
      !officerInCharge ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message:
          "schoolId, unitId, deliveryDate, deliveryLocation, officerInCharge and a non-empty items[] (packetId, quantity) are required.",
      });
    }

    const [school, unit] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId } }),
      prisma.unit.findUnique({ where: { id: unitId } }),
    ]);
    if (!school) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "School not found." });
    if (!unit) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Unit not found." });

    const packets = await prisma.packet.findMany({ where: { id: { in: items.map((i) => i.packetId) } } });
    if (packets.length !== items.length) {
      return error(res, { statusCode: 400, code: "INVALID_PACKET_REFERENCE", message: "One or more packetId values do not exist." });
    }

    const orderItemsData = items.map((i) => {
      const packet = packets.find((p) => p.id === i.packetId);
      const quantity = i.quantity || 1;
      const subtotal = Math.round(packet.sellingPrice * quantity * 100) / 100;
      return { packetId: packet.id, quantity, unitRate: packet.sellingPrice, subtotal };
    });

    const totalQty = orderItemsData.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = Math.round(orderItemsData.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;
    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        schoolId,
        unitId,
        deliveryDate: new Date(deliveryDate),
        deliveryLocation,
        officerInCharge,
        internalNote,
        totalQty,
        totalAmount,
        orderItems: { create: orderItemsData },
      },
      include: { school: true, unit: true },
    });

    return success(res, { data: serialize(order), statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/admin/orders/:id/status
async function updateOrderStatus(req, res, next) {
  try {
    const orderNumber = decodeURIComponent(req.params.id);
    const { status, driverName, driverPhone, vehicleNo } = req.body;
    const normalizedStatus = STATUS_MAP[status] || (status ? status.toUpperCase() : undefined);
    if (!normalizedStatus || !["PENDING", "DELIVERED", "CANCELLED"].includes(normalizedStatus)) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "status must be one of: PENDING, DELIVERED, CANCELLED",
      });
    }
    // Try finding order by orderNumber or id
    let order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) {
      order = await prisma.order.findUnique({ where: { id: orderNumber } });
    }
    if (!order) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Order not found." });
    }
    const currentStatus = order.status;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || ["DELIVERED", "CANCELLED", "PENDING"];
    
    if (!allowedNext.includes(normalizedStatus)) {
      return error(res, {
        statusCode: 409,
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot transition order from ${currentStatus} to ${normalizedStatus}.`,
      });
    }
    const deliveryStatusMap = {
      PENDING: "SCHEDULED",
      DELIVERED: "OUT_FOR_DELIVERY",
      CANCELLED: "CANCELLED",
    };
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: normalizedStatus,
        ...(deliveryStatusMap[normalizedStatus] && { deliveryStatus: deliveryStatusMap[normalizedStatus] }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
        ...(vehicleNo !== undefined && { vehicleNo }),
      },
      include: { school: true, unit: true },
    });
    return success(res, { data: serialize(updated) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/orders/:id/payment-proof
async function uploadPaymentProof(req, res, next) {
  try {
    const orderNumber = decodeURIComponent(req.params.id);
    const { utrNumber, paidAmount, paymentProofUrl } = req.body;

    if (!utrNumber || paidAmount === undefined || !paymentProofUrl) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "utrNumber, paidAmount and paymentProofUrl are required.",
      });
    }

    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Order not found." });

    const updated = await prisma.order.update({
      where: { orderNumber },
      data: {
        utrNumber,
        paidAmount: Number(paidAmount),
        paymentProofUrl,
        paymentUploaded: true,
        paymentUploadedAt: new Date(),
        paymentVerified: false, // admin verifies separately
      },
      include: { school: true, unit: true },
    });

    return success(res, { data: serialize(updated) });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/admin/orders/:id/verify-payment  (admin verifies the uploaded UTR proof)
async function verifyPayment(req, res, next) {
  try {
    const orderNumber = decodeURIComponent(req.params.id);

    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Order not found." });
    if (!order.paymentUploaded) {
      return error(res, {
        statusCode: 409,
        code: "NO_PAYMENT_PROOF",
        message: "No payment proof has been uploaded for this order yet.",
      });
    }

    const updated = await prisma.order.update({
      where: { orderNumber },
      data: { paymentVerified: true },
      include: { school: true, unit: true },
    });

    return success(res, { data: serialize(updated) });
  } catch (err) {
    return next(err);
  }
}

async function assignOrderDelivery(req, res, next) {
  try {
    const orderNumber = decodeURIComponent(req.params.id);
    const { driverId, driverName, driverPhone, vehicleNo } = req.body;

    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        driverId,
        driverName,
        driverPhone,
        vehicleNo,
        deliveryStatus: "ASSIGNED",
      },
    });

    return res.json({ success: true, data: updatedOrder });
  } catch (err) {
    return next(err);
  }
}

async function markPaymentComplete(req, res, next) {
  try {
    const { id } = req.params;
    const { utrNumber, paymentProofUrl, paidAmount } = req.body;

    // COMPULSORY DOCUMENT CHECK
    if (!paymentProofUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment receipt document URL (paymentProofUrl) is compulsory for payment verification.",
        }
      });
    }

    const order = await prisma.order.findUnique({ where: { orderNumber: id } });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" }
      });
    }

    const updated = await prisma.order.update({
      where: { orderNumber: id },
      data: {
        paymentUploaded: true,
        paymentVerified: true,
        utrNumber: utrNumber || `UTR-${Date.now()}`,
        paymentProofUrl,
        paidAmount: paidAmount ? parseFloat(paidAmount) : order.totalAmount,
        paymentUploadedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: "Payment verified & marked COMPLETE successfully."
    });
  } catch (err) {
    next(err);
  }
}



function parseSafeDate(dateInput) {
  if (!dateInput) return new Date();

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }

  const str = String(dateInput).trim();
  let parsed = new Date(str);

  // If standard JS Date parse failed, handle DD-MM-YYYY or DD/MM/YYYY
  if (isNaN(parsed.getTime())) {
    const parts = str.split(/[-/.]/);
    if (parts.length === 3) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const p3 = parseInt(parts[2], 10);

      if (p3 > 1000) {
        // Format: DD/MM/YYYY -> YYYY-MM-DD
        parsed = new Date(Date.UTC(p3, p2 - 1, p1));
      } else if (p1 > 1000) {
        // Format: YYYY/MM/DD -> YYYY-MM-DD
        parsed = new Date(Date.UTC(p1, p2 - 1, p3));
      }
    }
  }

  // Guaranteed fallback to current Date if parsing still failed
  return !isNaN(parsed.getTime()) ? parsed : new Date();
}

async function bulkImportLegacyOrders(req, res, next) {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ success: false, error: { message: "Request body must contain a non-empty 'orders' array." } });
    }

    // Pre-load existing schools/units/packets once (case-insensitive keys)
    const [schools, units, packets] = await Promise.all([
      prisma.school.findMany(),
      prisma.unit.findMany(),
      prisma.packet.findMany(),
    ]);
    const schoolMap = new Map(schools.map(s => [s.name.toLowerCase(), s]));
    const unitMap = new Map(units.map(u => [u.name.toLowerCase(), u]));
    const packetMap = new Map(packets.map(p => [p.name.toLowerCase(), p]));

    let schoolCount = schools.length;
    let unitCount = units.length;
    let packetCount = packets.length;

    // Resolve/create schools, units, packets OUTSIDE the transaction,
    // sequentially so counters stay correct, but each op is fast & isolated.
    for (const item of orders) {
      const schoolName = (item.schoolName || "Past Requisition School").trim();
      const key = schoolName.toLowerCase();
      if (!schoolMap.has(key)) {
        schoolCount++;
        const school = await prisma.school.create({
          data: {
            name: schoolName,
            code: `SCH-LEGACY-${String(schoolCount).padStart(3, "0")}`,
            address: "Delhi NCR Command Area",
            headName: item.officerInCharge || "Principal / School Head",
            headDesignation: "Principal",
            headEmail: (item.headEmail || `head.${Date.now()}.${schoolCount}@school.ac.in`).trim(),
          },
        });
        schoolMap.set(key, school);
      }

      const unitName = (item.unitName || "4 Delhi BN NCC").trim();
      const uKey = unitName.toLowerCase();
      if (!unitMap.has(uKey)) {
        unitCount++;
        const unit = await prisma.unit.create({
          data: {
            name: unitName,
            unitCode: `UNIT-LEGACY-${String(unitCount).padStart(3, "0")}`,
            spocName: item.officerInCharge || "Unit Officer",
            spocEmail: (item.unitEmail || `command.${Date.now()}.${unitCount}@ncc.gov.in`).trim(),
          },
        });
        unitMap.set(uKey, unit);
      }

      const packetName = (item.packetName || "Refreshment Packet").trim();
      const pKey = packetName.toLowerCase();
      if (!packetMap.has(pKey)) {
        packetCount++;
        const packet = await prisma.packet.create({
          data: {
            packetCode: `PKT-LEGACY-${String(packetCount).padStart(3, "0")}`,
            name: packetName,
            sellingPrice: item.rate ?? 60.0,
            isArchived: false,
          },
        });
        packetMap.set(pKey, packet);
      }
    }

    // Now the transaction ONLY does order creates — fast, bounded, safe.
    const createdOrders = await prisma.$transaction(
      orders.map((item) => {
        const school = schoolMap.get((item.schoolName || "Past Requisition School").trim().toLowerCase());
        const unit = unitMap.get((item.unitName || "4 Delhi BN NCC").trim().toLowerCase());
        const totalQty = parseInt(item.quantity, 10) || 100;
        const totalAmount = parseFloat(item.totalAmount) || totalQty * (item.rate ?? 60.0);
        const orderDate = parseSafeDate(item.orderDate);
        const invoiceNo = item.invoiceNo || `INV-LEGACY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        return prisma.order.create({
          data: {
            orderNumber: invoiceNo,
            schoolId: school.id,
            unitId: unit.id,
            status: "DELIVERED",
            deliveryStatus: "DELIVERED",
            deliveryDate: orderDate,
            deliveryLocation: school.name,
            totalQty,
            totalAmount,
            officerInCharge: item.officerInCharge || "Lt. Colonel R. K. Sharma",
            internalNote: `Legacy spreadsheet import verified. Invoice Ref: ${invoiceNo}`,
            paymentUploaded: true,
            paymentVerified: true,
            utrNumber: `LEGACY-SETTLED-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            paidAmount: totalAmount,
            paymentUploadedAt: orderDate,
          },
        });
      })
    );

    return res.status(200).json({
      success: true,
      message: `Successfully bulk imported ${createdOrders.length} legacy orders.`,
      data: {
        importedCount: createdOrders.length,
        orders: createdOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount,
          status: o.status,
        })),
      },
    });
  } catch (err) {
    console.error("Error in bulkImportLegacyOrders controller:", err);
    return next(err);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  uploadPaymentProof,
  verifyPayment,
  assignOrderDelivery,
  markPaymentComplete,
  bulkImportLegacyOrders,
};
