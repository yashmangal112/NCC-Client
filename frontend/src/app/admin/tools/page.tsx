"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth";

interface ParsedOrderRow {
  schoolName: string;
  headEmail: string;
  unitName: string;
  unitEmail: string;
  orderDate: string;
  packetName: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  officerInCharge: string;
  status: string;
  invoiceNo: string;
  validationStatus: "VALID" | "WARNING" | "ERROR";
  validationNote: string;
}

/**
 * SAFE DATE FORMATTER (Ensures YYYY-MM-DD format for Prisma Date fields)
 */
function formatSafeISODate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const str = dateStr.trim();

  // Try standard parse
  let d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    if (p3 > 1000) {
      // DD/MM/YYYY -> YYYY-MM-DD
      d = new Date(Date.UTC(p3, p2 - 1, p1));
    } else if (p1 > 1000) {
      // YYYY/MM/DD -> YYYY-MM-DD
      d = new Date(Date.UTC(p1, p2 - 1, p3));
    }
  }

  return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
}

/**
 * ROBUST CSV LINE PARSER
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function ExtraFeaturesPage() {
  // Modal & Tool Launcher States
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedOrderRow[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importCompleted, setImportCompleted] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Download Standard CSV/Excel Template
  const handleDownloadTemplate = () => {
    const csvContent =
      "School Name,School Head Email,Unit Name,Unit Officer Email,Order Date,Packet Name,Quantity,Rate,Total Amount,Officer In Charge,Status\n" +
      '"GBSSS Molarband No 1","principal@molarband.edu.in","4 Delhi BN NCC","command.4bn@ncc.gov.in","2025-09-15","Standard Refreshment Packet",100,64.00,6400.00,"Lt. Colonel R. K. Sharma","DELIVERED"\n' +
      '"Desh Bandhu College, Kalka Ji","principal@deshbandhu.du.ac.in","4 Delhi BN NCC","command.4bn@ncc.gov.in","2025-10-20","Special Training Refreshment Pack",150,60.00,9000.00,"Major V. K. Singh","DELIVERED"\n' +
      '"Acharya Narendra Dev College","head@andc.du.ac.in","7 Delhi BN NCC","command.7bn@ncc.gov.in","2025-11-05","Cadet Refreshment Pack",200,55.00,11000.00,"Captain A. K. Roy","DELIVERED"\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "legacy_requisition_orders_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parser with safe date formatting
  const parseCSV = (text: string) => {
    const rawLines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "");
    if (rawLines.length <= 1) {
      setErrorMsg("Uploaded Excel/CSV file is empty or missing data rows.");
      return;
    }

    const rows: ParsedOrderRow[] = [];
    const year = new Date().getFullYear();

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      const cleaned = parseCSVLine(line);

      if (cleaned.length < 5) continue;

      const schoolName = cleaned[0] || "Past Requisition School";
      const headEmail = cleaned[1] || `head.${Date.now() + i}@school.ac.in`;
      const unitName = cleaned[2] || "4 Delhi BN NCC";
      const unitEmail = cleaned[3] || `command.${Date.now() + i}@ncc.gov.in`;
      const rawDateStr = cleaned[4] || "2025-08-15";
      const safeOrderDate = formatSafeISODate(rawDateStr);
      const packetName = cleaned[5] || "Refreshment Packet";
      const quantity = parseInt(cleaned[6], 10) || 100;
      const rate = parseFloat(cleaned[7]) || 60.0;
      const totalAmount = parseFloat(cleaned[8]) || quantity * rate;
      const officerInCharge = cleaned[9] || "Officer In Charge";
      const status = (cleaned[10] || "DELIVERED").toUpperCase();

      const invNo = `INV-LEGACY-${year}-${String(i).padStart(3, "0")}`;

      let validationStatus: "VALID" | "WARNING" | "ERROR" = "VALID";
      let validationNote = "Ready for Batch Import & Invoice Generation";

      if (!cleaned[0]) {
        validationStatus = "WARNING";
        validationNote = "Missing School Name (will default to Past School)";
      } else if (isNaN(totalAmount) || totalAmount <= 0) {
        validationStatus = "ERROR";
        validationNote = "Invalid Amount or Quantity";
      }

      rows.push({
        schoolName,
        headEmail,
        unitName,
        unitEmail,
        orderDate: safeOrderDate,
        packetName,
        quantity,
        rate,
        totalAmount,
        officerInCharge,
        status,
        invoiceNo: invNo,
        validationStatus,
        validationNote,
      });
    }

    if (rows.length === 0) {
      setErrorMsg("Could not parse any valid order rows from the file.");
    } else {
      setParsedRows(rows);
      setErrorMsg("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportCompleted(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setImportCompleted(false);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(droppedFile);
    }
  };

  // Confirm Batch Import (STRICT CHECK: ONLY SHOW SUCCESS IF API OK)
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setErrorMsg("");

    try {
      const validRows = parsedRows.filter((r) => r.validationStatus !== "ERROR");
      const res = await authFetch("/api/admin/orders/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: validRows }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const count = json.data?.importedCount || validRows.length;
        setImportedCount(count);
        setImportCompleted(true);
        setParsedRows([]);
        return;
      }

      // API returned error response
      const apiError =
        json.error?.message ||
        json.message ||
        "Failed to import orders. Please check your database connection.";
      setErrorMsg(apiError);
      setImportCompleted(false);
    } catch (err: any) {
      console.error("Bulk import API call failed:", err);
      setErrorMsg("Server error occurred while calling bulk import API.");
      setImportCompleted(false);
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.validationStatus === "VALID").length;
  const warningCount = parsedRows.filter((r) => r.validationStatus === "WARNING").length;

  return (
    <div className="p-container-padding flex-1 bg-paper/30 font-sans relative">
      {/* HEADER SECTION WITH PREMIUM METALLIC BADGE */}
      <div className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brass text-3xl">construction</span>
            <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-ink-navy">
              Extra Features &amp; Tools
            </h1>
          </div>
          <p className="font-sans text-sm text-steel mt-1 max-w-2xl">
            Administrative utilities suite, Excel data migration tools, and audit management features.
          </p>
        </div>
      </div>

      {/* EXTRA FEATURES TOOL CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-stack-lg">
        {/* CARD 1: IMPORT PAST EXCEL ORDERS TOOL */}
        <div className="bg-white border-2 border-brass rounded-xl p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brass/10 rounded-bl-full pointer-events-none"></div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-brass/15 text-brass flex items-center justify-center border border-brass/30 shadow-sm">
                <span className="material-symbols-outlined text-2xl">table_chart</span>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-brass text-ink-navy text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">workspace_premium</span>
                PREMIUM TOOL
              </span>
            </div>

            <h3 className="font-headline font-bold text-xl text-ink-navy mb-2 flex items-center gap-1.5">
              <span>Import Past Excel Orders</span>
            </h3>

            <p className="text-xs text-steel leading-relaxed mb-4">
              Batch import historical order spreadsheets (`.csv`, `.xlsx`). Automatically maps schools, head emails, units, assigns sequential Tax Invoice numbers, and populates the Reports ledger.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 bg-paper text-ink-navy border border-hairline rounded text-[10px] font-bold">
                ⚡ Auto Tax Invoice Generator
              </span>
              <span className="px-2 py-0.5 bg-paper text-ink-navy border border-hairline rounded text-[10px] font-bold">
                ✓ Head &amp; Unit Email Resolver
              </span>
              <span className="px-2 py-0.5 bg-paper text-ink-navy border border-hairline rounded text-[10px] font-bold">
                👑 Chief Auditor Ready
              </span>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={() => {
                setShowImportModal(true);
                setFile(null);
                setParsedRows([]);
                setImportCompleted(false);
                setErrorMsg("");
              }}
              className="w-full py-3 bg-gradient-to-r from-brass via-amber-500 to-brass text-ink-navy font-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Launch Import Tool</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="w-full py-2 bg-paper hover:bg-hairline text-steel text-xs font-bold uppercase tracking-wider rounded border border-hairline transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>

        {/* CARD 2: BULK TAX INVOICE ARCHIVER */}
        <div className="bg-white border border-hairline rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-settled-green/10 text-settled-green flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
              </div>
              <span className="px-2.5 py-1 bg-settled-green/10 text-settled-green text-[10px] font-bold uppercase tracking-wider rounded border border-settled-green/30">
                ⭐ PRO UTILITY
              </span>
            </div>

            <h3 className="font-headline font-bold text-xl text-ink-navy mb-2">
              Bulk Invoice Archiver
            </h3>
            <p className="text-xs text-steel leading-relaxed">
              Export generated Tax Invoices for multiple schools into a single zipped archive bundle for quarterly auditing submissions.
            </p>
          </div>

          <div className="pt-6">
            <Link
              href="/reports"
              className="w-full py-2.5 bg-paper hover:bg-hairline text-ink-navy font-bold text-xs uppercase tracking-wider rounded border border-hairline transition-colors flex items-center justify-center gap-2 block text-center"
            >
              <span>View Reports Hub</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

      </div>

      {/* PREMIUM POPUP MODAL: IMPORT PAST EXCEL ORDERS WORKSPACE */}
      {showImportModal && (
        <>
          <div
            onClick={() => setShowImportModal(false)}
            className="fixed inset-0 bg-ink-navy/60 backdrop-blur-sm z-50 transition-opacity"
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white border-2 border-brass max-w-5xl w-full rounded-xl shadow-[0_0_40px_rgba(184,134,59,0.25)] overflow-hidden max-h-[90vh] flex flex-col">
              {/* Premium Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-ink-navy via-[#16271F] to-ink-navy text-white border-b border-brass/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brass/20 text-brass flex items-center justify-center border border-brass/40">
                    <span className="material-symbols-outlined text-xl">workspace_premium</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline font-bold text-lg text-paper">
                        Import Past Excel Orders Tool
                      </h3>
                      <span className="px-2 py-0.5 bg-brass text-ink-navy font-extrabold text-[9px] uppercase tracking-widest rounded-full font-data-mono">
                        ⭐ PREMIUM UTILITY
                      </span>
                    </div>
                    <p className="text-xs text-paper/70 font-sans">
                      Upload legacy spreadsheets to generate Tax Invoices &amp; sync historical records
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-paper/70 hover:text-white text-2xl font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Download Template Bar */}
                <div className="p-4 bg-paper/40 border border-hairline rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-bold text-xs text-ink-navy block">
                      Standard Spreadsheet Format (11 Columns)
                    </span>
                    <span className="text-[11px] text-steel">
                      Columns: School Name, School Head Email, Unit Name, Unit Email, Order Date, Packet Name, Qty, Rate, Total Amount, Officer In Charge, Status
                    </span>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-1.5 bg-[#107C41] hover:bg-[#0B5C30] text-white rounded font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Download Excel Template</span>
                  </button>
                </div>

                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed border-hairline hover:border-brass p-6 rounded-xl text-center transition-colors ${
                    isDragOver ? "bg-brass/5 border-brass opacity-80" : "bg-white"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-brass/10 text-brass flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                  </div>
                  <h4 className="font-bold text-sm text-ink-navy">
                    {file ? file.name : "Drag & Drop Legacy Excel or CSV File Here"}
                  </h4>
                  <p className="text-[11px] text-steel mt-1 mb-3">
                    Supports `.csv`, `.xlsx`, `.xls` spreadsheet files
                  </p>
                  <label className="px-5 py-2 bg-ink-navy text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-ink-navy/90 transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Error Display */}
                {errorMsg && (
                  <div className="p-3 bg-alert-rust/10 border border-alert-rust text-alert-rust rounded text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* STRICT SUCCESS BANNER */}
                {importCompleted && (
                  <div className="p-5 bg-settled-green/10 border-2 border-settled-green/40 rounded-xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-settled-green text-white flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </div>
                    <h4 className="font-bold text-lg text-ink-navy">
                      Successfully Imported {importedCount} Legacy Orders!
                    </h4>
                    <p className="text-xs text-steel">
                      Assigned Tax Invoice numbers and populated historical records into database.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <Link
                        href="/reports"
                        onClick={() => setShowImportModal(false)}
                        className="px-5 py-2 bg-settled-green text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                        <span>Generate Tax Invoices</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setShowImportModal(false)}
                        className="px-5 py-2 bg-paper border border-hairline text-ink-navy font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-hairline transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">orders</span>
                        <span>View Orders Register</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Dry Run Preview Table */}
                {parsedRows.length > 0 && !importCompleted && (
                  <div className="border border-hairline rounded-lg overflow-hidden space-y-0">
                    <div className="px-4 py-3 bg-paper/60 border-b border-hairline flex justify-between items-center">
                      <span className="font-bold text-xs text-ink-navy">
                        Parsed Orders Preview ({parsedRows.length} Rows)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-data-mono text-settled-green font-bold">
                          ✓ {validCount} Valid
                        </span>
                        {warningCount > 0 && (
                          <span className="text-[11px] font-data-mono text-amber-600 font-bold">
                            ⚠️ {warningCount} Warnings
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-paper/80 text-steel font-bold uppercase text-[9px] tracking-wider sticky top-0 border-b border-hairline z-10">
                          <tr>
                            <th className="px-4 py-2.5">Invoice No</th>
                            <th className="px-4 py-2.5">School &amp; Head Email</th>
                            <th className="px-4 py-2.5">Unit &amp; Email</th>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Packet</th>
                            <th className="px-4 py-2.5 text-right">Qty</th>
                            <th className="px-4 py-2.5 text-right">Officer In Charge</th>
                            <th className="px-4 py-2.5 text-right">Amount</th>
                            <th className="px-4 py-2.5 text-center">Status Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                          {parsedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-paper/20">
                              <td className="px-4 py-2.5 font-data-mono font-bold text-brass">
                                {row.invoiceNo}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-bold text-ink-navy">{row.schoolName}</div>
                                <div className="text-[10px] text-steel font-data-mono">{row.headEmail}</div>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-bold text-steel">{row.unitName}</div>
                                <div className="text-[10px] text-steel/80 font-data-mono">{row.unitEmail}</div>
                              </td>
                              <td className="px-4 py-2.5 font-data-mono text-steel">{row.orderDate}</td>
                              <td className="px-4 py-2.5 text-ink-navy">{row.packetName}</td>
                              <td className="px-4 py-2.5 text-right font-data-mono font-bold text-ink-navy">
                                {row.quantity}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-ink-navy">
                                {row.officerInCharge}
                              </td>
                              <td className="px-4 py-2.5 text-right font-data-mono font-bold text-brass">
                                ₹{row.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="px-2 py-0.5 bg-settled-green/10 text-settled-green border border-settled-green/30 rounded text-[9px] font-bold uppercase">
                                  {row.validationNote}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 bg-paper/40 border-t border-hairline flex justify-between items-center shrink-0">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-paper border border-hairline text-ink-navy font-bold text-xs uppercase tracking-wider rounded hover:bg-hairline cursor-pointer"
                >
                  Close
                </button>

                {parsedRows.length > 0 && !importCompleted && (
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-6 py-2.5 bg-gradient-to-r from-brass via-amber-500 to-brass text-ink-navy font-bold text-xs uppercase tracking-wider rounded shadow-md hover:brightness-110 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {importing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">
                          sync
                        </span>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">cloud_upload</span>
                        <span>Confirm &amp; Batch Import Orders</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
