const prisma = require("../lib/prisma");

/**
 * Generates the next sequential code for a given prefix/model, e.g.
 *   generateCode({ model: "sku", prefix: "SKU", field: "skuCode" })
 *   -> "SKU-2024-007"
 *
 * `model` must be a prisma delegate name (prisma[model]).
 * Codes follow the pattern `${prefix}-${year}-${sequence}` except
 * orderNumber and unitCode which follow their own doc-defined formats.
 */
async function generateYearSequenceCode({ model, field, prefix, padLength = 3 }) {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-`;

  const count = await prisma[model].count({
    where: { [field]: { startsWith: like } },
  });

  const sequence = String(count + 1).padStart(padLength, "0");
  return `${like}${sequence}`;
}

/** e.g. PKT-004 (no year segment, per docs) */
async function generateSimpleSequenceCode({ model, field, prefix, padLength = 3 }) {
  const count = await prisma[model].count();
  const sequence = String(count + 1).padStart(padLength, "0");
  return `${prefix}-${sequence}`;
}

/** e.g. #ORD-9942 */
async function generateOrderNumber() {
  const random = Math.floor(1000 + Math.random() * 9000);
  const candidate = `#ORD-${random}`;
  const exists = await prisma.order.findUnique({ where: { orderNumber: candidate } });
  if (exists) return generateOrderNumber();
  return candidate;
}

/** e.g. UNIT-005 */
async function generateUnitCode() {
  return generateSimpleSequenceCode({ model: "unit", field: "unitCode", prefix: "UNIT" });
}

module.exports = {
  generateYearSequenceCode,
  generateSimpleSequenceCode,
  generateOrderNumber,
  generateUnitCode,
};
