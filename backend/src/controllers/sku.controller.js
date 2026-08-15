const prisma = require("../lib/prisma");
const { success, error, buildMeta, parsePagination } = require("../utils/response");
const { generateYearSequenceCode } = require("../utils/generateCode");

const VALID_CATEGORIES = ["Beverages", "Medical", "Rations", "Packaging", "Stationery"];

const skuInclude = {
  vendor: {
    select: {
      id: true,
      vendorCode: true,
      name: true,
      contactPerson: true,
      phone: true,
    },
  },
};

function serializeSku(sku) {
  return {
    id: sku.id,
    skuCode: sku.skuCode,
    name: sku.name,
    category: sku.category,
    costPrice: sku.costPrice,
    sellingPrice: sku.sellingPrice || Number((sku.costPrice).toFixed(2)),
    quantity: sku.quantity || 0,
    unitOfMeasure: sku.unitOfMeasure || "Pack",
    description: sku.description || null,
    isArchived: sku.isArchived || false,
    createdAt: sku.createdAt,
    updatedAt: sku.updatedAt,
    vendorId: sku.vendorId || sku.vendor?.id || null,
    vendorName: sku.vendor?.name || "Approved Supplier",
    vendor: sku.vendor
      ? {
          id: sku.vendor.id,
          vendorCode: sku.vendor.vendorCode,
          name: sku.vendor.name,
          contactPerson: sku.vendor.contactPerson,
          phone: sku.vendor.phone,
        }
      : null,
  };
}


// GET /api/admin/skus
async function getSkus(req, res, next) {
  try {
    const { search, category, includeArchived } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (!includeArchived || includeArchived === "false") {
      where.isArchived = false;
    }
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return error(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }
      where.category = category;
    }
    // Search across SKU Name, SKU Code, or Vendor Name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { skuCode: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    const [skus, total] = await Promise.all([
      prisma.sku.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: skuInclude, // INCLUDES VENDOR RELATION
      }),
      prisma.sku.count({ where }),
    ]);
    return success(res, {
      data: skus.map(serializeSku),
      meta: buildMeta({ page, limit, total }),
    });
  } catch (err) {
    return next(err);
  }
}
// ------------------------------------------------------------------
// 2. GET /api/admin/skus/:id (Get Single SKU by ID with Vendor Details)
// ------------------------------------------------------------------
async function getSkuById(req, res, next) {
  try {
    const sku = await prisma.sku.findUnique({
      where: { id: req.params.id },
      include: skuInclude, // INCLUDES VENDOR RELATION
    });
    if (!sku) {
      return error(res, {
        statusCode: 404,
        code: "NOT_FOUND",
        message: "SKU not found.",
      });
    }
    return success(res, { data: serializeSku(sku) });
  } catch (err) {
    return next(err);
  }
}


// POST /api/admin/skus
async function createSku(req, res, next) {
  try {
    const { skuCode, name, category, costPrice, unitOfMeasure, description } = req.body;

    if (!name || !category || costPrice === undefined) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "name, category and costPrice are required.",
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const finalSkuCode =
      skuCode || (await generateYearSequenceCode({ model: "sku", field: "skuCode", prefix: "SKU" }));

    const sku = await prisma.sku.create({
      data: {
        skuCode: finalSkuCode,
        name,
        category,
        costPrice: Number(costPrice),
        unitOfMeasure: unitOfMeasure || "Pack",
        description,
      },
    });

    return success(res, { data: sku, statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/admin/skus/:id
async function updateSku(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, costPrice, unitOfMeasure, description } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const sku = await prisma.sku.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(unitOfMeasure !== undefined && { unitOfMeasure }),
        ...(description !== undefined && { description }),
      },
    });

    return success(res, { data: sku });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/admin/skus/:id  (soft delete / archive)
async function archiveSku(req, res, next) {
  try {
    const { id } = req.params;
    const sku = await prisma.sku.update({
      where: { id },
      data: { isArchived: true },
    });
    return success(res, { data: sku });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSkus, getSkuById, createSku, updateSku, archiveSku };
