const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { success, error, parsePagination, buildMeta } = require("../utils/response");

// Helper to format vendor payload for frontend
function serializeVendor(v) {
  return {
    id: v.id,
    vendorCode: v.vendorCode,
    name: v.name,
    contactPerson: v.contactPerson,
    phone: v.phone,
    email: v.email || "",
    address: v.address || "",
    skusCount: v.vendorSkus ? v.vendorSkus.length : 0,
    skusList: (v.vendorSkus || []).map((vs) => ({
      id: vs.id,
      sku: vs.sku?.name || "SKU Item",
      skuId: vs.sku?.skuCode || vs.skuId,
      classification: vs.sku?.category || "Food",
      price: String(vs.price || vs.sku?.costPrice || 0),
      qty: String(vs.quantity || vs.sku?.quantity || 0),
    })),
  };
}

// ------------------------------------------------------------------
// 1. GET /api/admin/vendors
// ------------------------------------------------------------------
async function getVendors(req, res, next) {
  try {
    const { search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendorSkus: {
            include: { sku: true },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return success(res, {
      data: vendors.map(serializeVendor),
      meta: buildMeta({ page, limit, total }),
    });
  } catch (err) {
    return next(err);
  }
}

// ------------------------------------------------------------------
// 2. POST /api/admin/vendors (Create Vendor & SKU Mappings with Stock Qty)
// ------------------------------------------------------------------
async function createVendor(req, res, next) {
  try {
    const { name, contactPerson, phone, email, address, skusList } = req.body;

    if (!name || !contactPerson || !phone) {
      return error(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Vendor name, contact person, and phone number are required.",
      });
    }

    const count = await prisma.vendor.count();
    const vendorCode = `VEN-${String(count + 1).padStart(3, "0")}`;

    // Pre-fetch existing SKUs OUTSIDE the transaction, in a single query,
    // instead of doing a findFirst per item inside the tx.
    const validItems = Array.isArray(skusList)
      ? skusList.filter((item) => item.sku && item.sku.trim())
      : [];

    let existingSkus = [];
    if (validItems.length > 0) {
      existingSkus = await prisma.sku.findMany({
        where: {
          OR: validItems.flatMap((item) => [
            ...(item.skuId ? [{ skuCode: item.skuId }] : []),
            { name: { equals: item.sku, mode: "insensitive" } },
          ]),
        },
      });
    }

    const findExisting = (item) =>
      existingSkus.find(
        (s) =>
          (item.skuId && s.skuCode === item.skuId) ||
          s.name.toLowerCase() === item.sku.toLowerCase()
      );

    const newVendor = await prisma.$transaction(
      async (tx) => {
        const vendor = await tx.vendor.create({
          data: {
            vendorCode,
            name,
            contactPerson,
            phone,
            email: email || null,
            address: address || null,
          },
        });

        for (const item of validItems) {
          const existing = findExisting(item);
          const skuCode = existing?.skuCode || item.skuId || `SKU-${Date.now().toString().slice(-6)}`;
          const costPrice = Number(item.price) || 0;
          const stockQty = Number(item.qty) || 0;

          // upsert = 1 round trip instead of findFirst + create/update
          const sku = await tx.sku.upsert({
            where: { skuCode },
            update: {
              costPrice,
              quantity: stockQty,
              vendorId: vendor.id,
            },
            create: {
              skuCode,
              name: item.sku,
              category: item.classification || "Food",
              costPrice,
              quantity: stockQty,
              vendorId: vendor.id,
            },
          });

          await tx.vendorSku.create({
            data: {
              vendorId: vendor.id,
              skuId: sku.id,
              price: costPrice,
              quantity: stockQty,
            },
          });
        }

        return tx.vendor.findUnique({
          where: { id: vendor.id },
          include: { vendorSkus: { include: { sku: true } } },
        });
      },
      {
        timeout: 15000,
        maxWait: 5000,
      }
    );

    return success(res, { statusCode: 201, data: serializeVendor(newVendor) });
  } catch (err) {
    return next(err);
  }
}
// ------------------------------------------------------------------
// 3. PUT /api/admin/vendors/:id (Update Vendor & SKU Mappings)
// ------------------------------------------------------------------
async function updateVendor(req, res, next) {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, skusList } = req.body;

    const validItems = Array.isArray(skusList)
      ? skusList.filter((item) => item.sku && item.sku.trim())
      : [];

    // Pre-fetch existing SKUs OUTSIDE the transaction — single round trip
    let existingSkus = [];
    if (validItems.length > 0) {
      existingSkus = await prisma.sku.findMany({
        where: {
          OR: validItems.flatMap((item) => [
            ...(item.skuId ? [{ skuCode: item.skuId }] : []),
            { name: { equals: item.sku, mode: "insensitive" } },
          ]),
        },
      });
    }

    const findExisting = (item) =>
      existingSkus.find(
        (s) =>
          (item.skuId && s.skuCode === item.skuId) ||
          s.name.toLowerCase() === item.sku.toLowerCase()
      );

    const updatedVendor = await prisma.$transaction(
      async (tx) => {
        await tx.vendor.update({
          where: { id },
          data: {
            name,
            contactPerson,
            phone,
            email: email || null,
            address: address || null,
          },
        });

        // Clear existing VendorSku links
        await tx.vendorSku.deleteMany({ where: { vendorId: id } });

        const vendorSkuRows = [];

        for (const item of validItems) {
          const existing = findExisting(item);
          const skuCode = existing?.skuCode || item.skuId || `SKU-${Date.now().toString().slice(-6)}`;
          const costPrice = Number(item.price) || 0;
          const stockQty = Number(item.qty) || 0;

          // upsert: 1 round trip, and now actually updates price/qty/vendorId
          // for existing SKUs instead of silently ignoring changes
          const sku = await tx.sku.upsert({
            where: { skuCode },
            update: {
              costPrice,
              quantity: stockQty,
              vendorId: id,
            },
            create: {
              skuCode,
              name: item.sku,
              category: item.classification || "Food",
              costPrice,
              quantity: stockQty,
              vendorId: id,
            },
          });

          vendorSkuRows.push({
            vendorId: id,
            skuId: sku.id,
            price: costPrice,
            quantity: stockQty,
          });
        }

        // Batch insert instead of N sequential creates
        if (vendorSkuRows.length > 0) {
          await tx.vendorSku.createMany({ data: vendorSkuRows });
        }

        return tx.vendor.findUnique({
          where: { id },
          include: { vendorSkus: { include: { sku: true } } },
        });
      },
      {
        timeout: 15000,
        maxWait: 5000,
      }
    );

    return success(res, { data: serializeVendor(updatedVendor) });
  } catch (err) {
    return next(err);
  }
}

// ------------------------------------------------------------------
// 4. DELETE /api/admin/vendors/:id
// ------------------------------------------------------------------
async function deleteVendor(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.vendor.delete({ where: { id } });
    return success(res, { message: "Vendor record deleted successfully." });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
};