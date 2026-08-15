const { Parser: CsvParser } = require("json2csv");
const PDFDocument = require("pdfkit");
const prisma = require("../lib/prisma"); // adjust path to your prisma client
const { success, error } = require("../utils/response");
const { NODATA } = require("node:dns");

/** Parses a "Month YYYY" string (e.g. "October 2024" or "August 2026") into a UTC [start, end) range. */
function parseMonthRange(monthStr) {
  if (!monthStr || monthStr === "All Months") return null;

  const parsed = new Date(`${monthStr} 1`);
  if (isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = parsed.getMonth(); // 0-indexed
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const label = `${String(start.getUTCDate()).padStart(2, "0")} ${start.toLocaleString("en-US", {
    month: "short",
  })} ${year} - ${String(new Date(end - 1).getUTCDate()).padStart(2, "0")} ${new Date(end - 1).toLocaleString(
    "en-US",
    { month: "short" }
  )} ${year}`;

  return { start, end, label };
}

/** Shared query builder + data-fetch used by JSON, CSV and PDF endpoints. */
async function buildReportData(query) {
  const { month, units, schools, status } = query;

  const where = {};

  if (month && month !== "All Months") {
    const range = parseMonthRange(month);
    if (range) {
      where.deliveryDate = { gte: range.start, lt: range.end };
      where._reportingPeriod = range.label;
    }
  }

  if (units) {
    const unitNames = units.split(",").map((u) => u.trim());
    where.unit = { name: { in: unitNames } };
  }

  if (schools) {
    const schoolNames = schools.split(",").map((s) => s.trim());
    where.school = { name: { in: schoolNames } };
  }

  if (status && status !== "All") {
    where.status = status.toUpperCase();
  }

  const reportingPeriod = where._reportingPeriod;
  delete where._reportingPeriod;


  if (status && status !== "All") { 
    const requestedStatus = status.toUpperCase(); 
    if (requestedStatus !== "PENDING") { 
      where.status = requestedStatus; 
    } 
    else { 
      where.status = "PENDING"; 
    } 
  }

  const orders = await prisma.order.findMany({
    where: {...where, NOT: { status: "PENDING" } },
    include: { school: true, unit: true },
    orderBy: { deliveryDate: "asc" },
  });

  const totalRequisitions = orders.length;
  const totalQty = orders.reduce((sum, o) => sum + (o.totalQty || o.quantity || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0);
  
  // Count DELIVERED and SETTLED orders for collection rate
  // Count DELIVERED orders for collection rate
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const collectionRate = totalRequisitions > 0 ? Math.round((deliveredCount / totalRequisitions) * 100) : 0;

  const groupedByUnit = {};
  for (const order of orders) {
    const unitName = order.unit?.name || "Command Unit";
    if (!groupedByUnit[unitName]) groupedByUnit[unitName] = [];
    
    const qty = order.totalQty || order.quantity || 0;
    const amount = order.totalAmount || order.amount || 0;
    const orderNumStr = String(order.orderNumber || order.id || "0");
    const invoiceNo = `INV-${orderNumStr.replace(/\D/g, "") || orderNumStr}`;

    groupedByUnit[unitName].push({
      schoolName: order.school?.name || "School",
      schoolCode: order.school?.code || "SCH-001",
      deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().slice(0, 10) : "TBD",
      invoiceNo,
      status: order.status,
      qty,
      rate: qty > 0 ? Math.round((amount / qty) * 100) / 100 : 0,
      amount,
    });
  }

  return {
    reportingPeriod: reportingPeriod || (month && month !== "All Months" ? month : "All Time"),
    scope: "Delhi Directorate",
    kpis: {
      totalRequisitions,
      totalQty,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      collectionRate: `${collectionRate}%`,
    },
    groupedByUnit,
    _flatRows: orders.map((order) => {
      const orderNumStr = String(order.orderNumber || order.id || "0");
      return {
        unit: order.unit?.name || "Unit",
        school: order.school?.name || "School",
        schoolCode: order.school?.code || "SCH-001",
        deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().slice(0, 10) : "TBD",
        invoiceNo: `INV-${orderNumStr.replace(/\D/g, "") || orderNumStr}`,
        qty: order.totalQty || order.quantity || 0,
        amount: order.totalAmount || order.amount || 0,
        status: order.status,
      };
    }),
  };
}

// GET /api/admin/reports
async function getReports(req, res, next) {
  try {
    const result = await buildReportData(req.query);
    if (result.error) {
      return error(res, { statusCode: 400, code: "VALIDATION_ERROR", message: result.error });
    }
    const { _flatRows, ...data } = result;
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/reports/export-csv
async function exportCsv(req, res, next) {
  try {
    const result = await buildReportData(req.query);
    if (result.error) {
      return error(res, { statusCode: 400, code: "VALIDATION_ERROR", message: result.error });
    }

    const fields = ["unit", "school", "schoolCode", "deliveryDate", "invoiceNo", "qty", "amount", "status"];
    const parser = new CsvParser({ fields });
    const csv = parser.parse(result._flatRows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-report-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/reports/export-pdf
async function exportPdf(req, res, next) {
  try {
    const result = await buildReportData(req.query);
    if (result.error) {
      return error(res, { statusCode: 400, code: "VALIDATION_ERROR", message: result.error });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="audit-report-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(16).text("Procurement Ledger — Audit Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Reporting Period: ${result.reportingPeriod}`);
    doc.text(`Scope: ${result.scope}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Total Requisitions: ${result.kpis.totalRequisitions}`);
    doc.text(`Total Quantity: ${result.kpis.totalQty}`);
    doc.text(`Total Revenue: Rs. ${result.kpis.totalRevenue.toFixed(2)}`);
    doc.text(`Collection Rate: ${result.kpis.collectionRate}`);
    doc.moveDown(1);

    for (const [unitName, rows] of Object.entries(result.groupedByUnit)) {
      doc.fontSize(12).text(unitName, { underline: true });
      doc.fontSize(9);
      for (const row of rows) {
        doc.text(
          `${row.deliveryDate}  |  ${row.schoolName} (${row.schoolCode})  |  ${row.invoiceNo}  |  Qty: ${row.qty}  |  Rs. ${row.amount.toFixed(
            2
          )}`
        );
      }
      doc.moveDown(0.5);
    }

    doc.moveDown(2);
    doc.fontSize(10).text("Certified correct by Quartermaster:", { continued: false });
    doc.moveDown(2);
    doc.text("_______________________________");
    doc.text("Quartermaster Signature & Stamp");

    doc.end();
  } catch (err) {
    return next(err);
  }
}

module.exports = { getReports, exportCsv, exportPdf };