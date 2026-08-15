const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateYearSequenceCode } = require("../utils/generateCode");

const VALID_STATUSES = ["PENDING", "FULFILLED", "DECLINED"];

function serialize(reqRow) {
  return {
    id: reqRow.id,
    requestCode: reqRow.requestCode,
    schoolId: reqRow.schoolId,
    schoolName: reqRow.school.name,
    requestedBy: reqRow.requestedBy,
    description: reqRow.description,
    status: reqRow.status,
    declineReason: reqRow.declineReason,
    fulfilledPacketId: reqRow.fulfilledPacketId,
    createdAt: reqRow.createdAt,
  };
}

// GET /api/admin/packet-requests
async function getPacketRequests(req, res, next) {
  try {
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (status) {
      const normalized = status.toUpperCase();
      if (!VALID_STATUSES.includes(normalized)) {
        return error(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: `status must be one of: Pending, Fulfilled, Declined`,
        });
      }
      where.status = normalized;
    }

    const [requests, total] = await Promise.all([
      prisma.packetRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { school: true },
      }),
      prisma.packetRequest.count({ where }),
    ]);

    return success(res, {
      data: requests.map(serialize),
      meta: buildMeta({ page, limit, total }),
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/packet-requests  (school head submits a custom request)
async function createPacketRequest(req, res, next) {
  try {
    const { schoolId, requestedBy, description } = req.body;

    if (!schoolId || !requestedBy || !description) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "schoolId, requestedBy and description are required.",
      });
    }

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "School not found." });
    }

    const requestCode = await generateYearSequenceCode({
      model: "packetRequest",
      field: "requestCode",
      prefix: "REQ",
    });

    const created = await prisma.packetRequest.create({
      data: { requestCode, schoolId, requestedBy, description },
      include: { school: true },
    });

    return success(res, { data: serialize(created), statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/packet-requests/:id/fulfill
async function fulfillPacketRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { fulfilledPacketId, notes } = req.body;

    const request = await prisma.packetRequest.findUnique({ where: { id } });
    if (!request) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Packet request not found." });
    }
    if (request.status !== "PENDING") {
      return error(res, {
        statusCode: 409,
        code: "INVALID_STATE",
        message: `Request has already been ${request.status.toLowerCase()}.`,
      });
    }

    if (fulfilledPacketId) {
      const packet = await prisma.packet.findUnique({ where: { id: fulfilledPacketId } });
      if (!packet) {
        return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Referenced packet not found." });
      }
    }

    const updated = await prisma.packetRequest.update({
      where: { id },
      data: {
        status: "FULFILLED",
        fulfilledPacketId: fulfilledPacketId || null,
        declineReason: null,
        description: notes ? `${request.description}\n\n[Fulfillment note]: ${notes}` : request.description,
      },
      include: { school: true },
    });

    return success(res, { data: serialize(updated) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/packet-requests/:id/decline
async function declinePacketRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "reason is required to decline a request.",
      });
    }

    const request = await prisma.packetRequest.findUnique({ where: { id } });
    if (!request) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Packet request not found." });
    }
    if (request.status !== "PENDING") {
      return error(res, {
        statusCode: 409,
        code: "INVALID_STATE",
        message: `Request has already been ${request.status.toLowerCase()}.`,
      });
    }

    const updated = await prisma.packetRequest.update({
      where: { id },
      data: { status: "DECLINED", declineReason: reason },
      include: { school: true },
    });

    return success(res, { data: serialize(updated) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPacketRequests,
  createPacketRequest,
  fulfillPacketRequest,
  declinePacketRequest,
};
