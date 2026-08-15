const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateSimpleSequenceCode } = require("../utils/generateCode");

function serializePacket(packet) {
  return {
    id: packet.id,
    packetCode: packet.packetCode,
    name: packet.name,
    category: packet.category,
    sellingPrice: packet.sellingPrice,
    totalCostPrice: packet.totalCostPrice,
    margin: packet.margin,
    description: packet.description,
    isArchived: packet.isArchived,
    status: packet.status,
    childSkus: packet.childSkus.map((ps) => ({
      skuId: ps.sku.id,
      skuCode: ps.sku.skuCode,
      skuName: ps.sku.name,
      quantity: ps.quantity,
      costPrice: ps.sku.costPrice,
      sellingPrice: ps.sellingPrice,
    })),
    mappedUnits: packet.units.map((pu) => ({
      unitId: pu.unit.id,
      unitCode: pu.unit.unitCode,
      unitName: pu.unit.name,
    })),
    createdAt: packet.createdAt,
  };
}

function computeCostAndMargin(childSkus, sellingPrice) {
  const totalCostPrice = childSkus.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  const margin = sellingPrice > 0 ? ((sellingPrice - totalCostPrice) / sellingPrice) * 100 : 0;
  return { totalCostPrice: round2(totalCostPrice), margin: round2(margin) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

const packetInclude = {
  childSkus: { include: { sku: true } },
  units: { include: { unit: true } },
};

async function assertUnitsExist(unitIds) {
  if (!unitIds || unitIds.length === 0) return [];
  const records = await prisma.unit.findMany({ where: { id: { in: unitIds } } });
  if (records.length !== unitIds.length) {
    const err = new Error("One or more unitId values do not exist.");
    err.statusCode = 400;
    err.code = "INVALID_UNIT_REFERENCE";
    throw err;
  }
  return records;
}

// GET /api/admin/packets
async function getPackets(req, res, next) {
  try {
    const { search, category, includeArchived, unit } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (!includeArchived || includeArchived === "false") {
      where.isArchived = false;
    }
    
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (unit) where.units = { some: { unit: { name: unit } } };
    const [packets, total] = await Promise.all([
      prisma.packet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: packetInclude,
      }),
      prisma.packet.count({ where }),
    ]);
    return success(res, {
      data: packets.map(serializePacket),
      meta: buildMeta({ page, limit, total }),
    });
  } catch (err) {
    return next(err);
  }
}



// GET /api/admin/packets/:id
async function getPacketById(req, res, next) {
  try {
    const packet = await prisma.packet.findUnique({ where: { id: req.params.id }, include: packetInclude });
    if (!packet) return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Packet not found." });
    return success(res, { data: serializePacket(packet) });
  } catch (err) {
    return next(err);
  }
}


// Helper function to generate safe non-colliding packet code
async function generateSafePacketCode() {
  const allPackets = await prisma.packet.findMany({
    select: { packetCode: true, code: true },
  });

  let maxNum = 0;
  allPackets.forEach((p) => {
    const codeStr = p.packetCode || p.code || "";
    const match = codeStr.match(/\d+/);
    if (match) {
      const val = parseInt(match[0], 10);
      if (val > maxNum) maxNum = val;
    }
  });

  return `PKT-${String(maxNum + 1).padStart(3, "0")}`;
}

// ------------------------------------------------------------------
// 1. POST /api/admin/packets (Create Packet Protocol)
// ------------------------------------------------------------------
async function createPacket(req, res, next) {
  try {
    const { packetCode, name, category, sellingPrice, description, skus, mappedUnits } = req.body;

    if (!name || !Array.isArray(skus) || skus.length === 0) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Packet name and a non-empty skus[] array are required.",
      });
    }

    // 1. Extract SKU IDs or Codes flexibly from incoming skus array
    const skuIdentifiers = skus.map((s) => s.skuId || s.id).filter(Boolean);

    // Search SKUs by matching either skuCode OR id
    const skuRecords = await prisma.sku.findMany({
      where: {
        OR: [
          { skuCode: { in: skuIdentifiers } },
          { id: { in: skuIdentifiers } },
        ],
      },
    });

    if (skuRecords.length !== skus.length) {
      return error(res, {
        statusCode: 400,
        code: "INVALID_SKU_REFERENCE",
        message: "One or more skuId values do not exist in inventory.",
      });
    }

    // 2. Extract Unit IDs safely handling various input formats
    const unitIds = Array.isArray(mappedUnits)
      ? mappedUnits.map((u) => (typeof u === "string" ? u : u.unitId || u.id)).filter(Boolean)
      : [];

    if (unitIds.length > 0 && typeof assertUnitsExist === "function") {
      await assertUnitsExist(unitIds);
    }

    // 3. Map child SKUs with quantity, cost price, and per-SKU selling price
    const childSkus = skus.map((s) => {
      const targetId = s.skuId || s.id;
      const record = skuRecords.find((r) => r.skuCode === targetId || r.id === targetId);
      const unitCost = Number(record?.costPrice) || 0;
      const itemSellingPrice = s.sellingPrice !== undefined ? Number(s.sellingPrice) : unitCost;

      return {
        skuId: record.id,
        quantity: Number(s.quantity) || 1,
        costPrice: unitCost,
        sellingPrice: itemSellingPrice,
      };
    });

    // 4. Compute Total Cost, Total Selling Price & Profit Margin
    const totalCostPrice = childSkus.reduce((sum, c) => sum + c.costPrice * c.quantity, 0);
    const calculatedSellingPrice = childSkus.reduce((sum, c) => sum + c.sellingPrice * c.quantity, 0);
    const finalSellingPrice = sellingPrice !== undefined ? Number(sellingPrice) : calculatedSellingPrice;
    const margin = Math.max(0, finalSellingPrice - totalCostPrice);

    // 5. Generate safe, collision-free Packet Code (e.g., PKT-004)
    let finalPacketCode = packetCode;
    if (!finalPacketCode) {
      finalPacketCode = await generateSafePacketCode();
    }

    // 6. Create Packet Record in Prisma with PacketSku sellingPrice
    const packet = await prisma.packet.create({
      data: {
        packetCode: finalPacketCode,
        name,
        category: category || "Standard Refreshment",
        sellingPrice: finalSellingPrice,
        totalCostPrice,
        margin,
        description: description || undefined,
        isArchived: false,
        status: "ACTIVE",
        childSkus: {
          create: childSkus.map((c) => ({
            skuId: c.skuId,
            quantity: c.quantity,
            sellingPrice: c.sellingPrice, // PERSISTS SELLING PRICE PER SKU IN PACKETSKU
          })),
        },
        units: {
          create: unitIds.map((unitId) => ({ unitId })),
        },
      },
      include: packetInclude,
    });

    return success(res, { data: serializePacket(packet), statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

// ------------------------------------------------------------------
// 2. PUT /api/admin/packets/:id (Update Packet Protocol)
// ------------------------------------------------------------------
async function updatePacket(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, sellingPrice, description, skus, mappedUnits } = req.body;

    const existing = await prisma.packet.findUnique({ where: { id }, include: packetInclude });
    if (!existing) {
      return error(res, { statusCode: 404, code: "NOT_FOUND", message: "Packet not found." });
    }

    let childSkus = (existing.childSkus || []).map((ps) => ({
      skuId: ps.skuId,
      quantity: ps.quantity,
      costPrice: Number(ps.sku?.costPrice) || 0,
      sellingPrice: Number(ps.sellingPrice || ps.sku?.costPrice) || 0,
    }));

    if (Array.isArray(skus) && skus.length > 0) {
      const skuIdentifiers = skus.map((s) => s.skuId || s.id).filter(Boolean);

      const skuRecords = await prisma.sku.findMany({
        where: {
          OR: [
            { skuCode: { in: skuIdentifiers } },
            { id: { in: skuIdentifiers } },
          ],
        },
      });

      if (skuRecords.length !== skus.length) {
        return error(res, {
          statusCode: 400,
          code: "INVALID_SKU_REFERENCE",
          message: "One or more skuId values do not exist in inventory.",
        });
      }

      childSkus = skus.map((s) => {
        const targetId = s.skuId || s.id;
        const record = skuRecords.find((r) => r.skuCode === targetId || r.id === targetId);
        const unitCost = Number(record?.costPrice) || 0;
        const itemSellingPrice = s.sellingPrice !== undefined ? Number(s.sellingPrice) : unitCost;

        return {
          skuId: record.id,
          quantity: Number(s.quantity) || 1,
          costPrice: unitCost,
          sellingPrice: itemSellingPrice,
        };
      });
    }

    let unitIds;
    if (Array.isArray(mappedUnits)) {
      unitIds = mappedUnits.map((u) => (typeof u === "string" ? u : u.unitId || u.id)).filter(Boolean);
      if (unitIds.length > 0 && typeof assertUnitsExist === "function") {
        await assertUnitsExist(unitIds);
      }
    }

    // Compute updated Cost, Selling Price & Margin
    const totalCostPrice = childSkus.reduce((sum, c) => sum + c.costPrice * c.quantity, 0);
    const calculatedSellingPrice = childSkus.reduce((sum, c) => sum + c.sellingPrice * c.quantity, 0);
    const finalSellingPrice = sellingPrice !== undefined ? Number(sellingPrice) : calculatedSellingPrice;
    const margin = Math.max(0, finalSellingPrice - totalCostPrice);

    const packet = await prisma.$transaction(async (tx) => {
      // 1. Delete existing PacketSku join records for this packet
      if (Array.isArray(skus)) {
        await tx.packetSku.deleteMany({ where: { packetId: id } });
        await tx.packetSku.createMany({
          data: childSkus.map((c) => ({
            packetId: id,
            skuId: c.skuId,
            quantity: c.quantity,
            sellingPrice: c.sellingPrice, // PERSISTS UPDATED SELLING PRICE PER SKU IN PACKETSKU
          })),
        });
      }

      // 2. Delete existing unit allocations and recreate
      if (unitIds) {
        await tx.packetUnitAllocation.deleteMany({ where: { packetId: id } });
        if (unitIds.length > 0) {
          await tx.packetUnitAllocation.createMany({
            data: unitIds.map((unitId) => ({ packetId: id, unitId })),
          });
        }
      }

      // 3. Update packet properties
      return tx.packet.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(category !== undefined && { category }),
          ...(description !== undefined && { description }),
          sellingPrice: finalSellingPrice,
          totalCostPrice,
          margin,
        },
        include: packetInclude,
      });
    });

    return success(res, { data: serializePacket(packet) });
  } catch (err) {
    return next(err);
  }
}

// 3. DELETE /api/admin/packets/:id (Archive)
async function archivePacket(req, res, next) {
  try {
    const packet = await prisma.packet.update({
      where: { id: req.params.id },
      data: { isArchived: true, status: "ARCHIVED" },
      include: packetInclude,
    });
    return success(res, { data: serializePacket(packet) });
  } catch (err) {
    return next(err);
  }
}
// 4. PATCH /api/admin/packets/:id/reactivate (Re-activate / Un-archive)
async function reactivatePacket(req, res, next) {
  try {
    const packet = await prisma.packet.update({
      where: { id: req.params.id },
      data: { isArchived: false, status: "ACTIVE" },
      include: packetInclude,
    });
    return success(res, { data: serializePacket(packet) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPackets, getPacketById, createPacket, updatePacket, archivePacket, reactivatePacket };
