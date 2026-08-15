"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { generateUpiQrUrl } from "@/utils/invoice";

export interface ReportRow {
  schoolName: string;
  schoolCode: string;
  deliveryDate: string;
  invoiceNo: string;
  qty: number;
  rate: number;
  amount: number;
  status: string;
}

export interface ReportKPIs {
  totalRequisitions: number;
  totalQty: number;
  totalRevenue: number;
  collectionRate: string;
}

export interface ReportData {
  reportingPeriod: string;
  scope: string;
  kpis: ReportKPIs;
  groupedByUnit: Record<string, ReportRow[]>;
}

export interface IssuingCompany {
  id: string;
  name: string;
  address: string;
  pincode: string;
  fssaiNo: string;
  gstinNo: string;
  stateName: string;
  email: string;
  logoImage: string;
  accountHolder: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
}

export const ISSUING_COMPANIES: IssuingCompany[] = [
  {
    id: "COMP-001",
    name: "FLAVOUR BASE INDIA LLP",
    address: "PLOT NO 413, SEC-01 IMT MANESAR, GURUGRAM, HARYANA",
    pincode: "122051",
    fssaiNo: "109755759485958",
    gstinNo: "06AAJDHFHFHFN7485",
    stateName: "Haryana, Code: 06",
    email: "Flavourbaseindia@gmail.com",
    logoImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/National_Cadet_Corps_%28India%29_Logo.svg/500px-National_Cadet_Corps_%28India%29_Logo.svg.png",
    accountHolder: "FLAVOUR BASE INDIA LLP",
    bankName: "State Bank of India CC A/c-1438",
    accountNo: "00000044504511438",
    ifscCode: "SBIN0064895",
  },
  {
    id: "COMP-002",
    name: "AGRO NUTRITION INDIA PRIVATE LIMITED",
    address: "PLOT NO 88, SEC-05 DSIIDC INDUSTRIAL COMPLEX, BAWANA, DELHI",
    pincode: "110039",
    fssaiNo: "10821005001185",
    gstinNo: "07AAHFF5294J1Z3",
    stateName: "Delhi, Code: 07",
    email: "agronutrition.india@gmail.com",
    logoImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Emblem_of_India.svg/300px-Emblem_of_India.svg.png",
    accountHolder: "FLAVOUR BASE INDIA LLP",
    bankName: "State Bank of India CC A/c-1438",
    accountNo: "00000044504511438",
    ifscCode: "SBIN0064895",
  },
  {
    id: "COMP-003",
    name: "SUPREME FOOD PRODUCTS & SERVICES",
    address: "PLOT NO 14, INDUSTRIAL AREA PHASE-II, NOIDA, UTTAR PRADESH",
    pincode: "201301",
    fssaiNo: "12720012000349",
    gstinNo: "09AAACS9482K1Z9",
    stateName: "Uttar Pradesh, Code: 09",
    email: "supremefoods.noida@gmail.com",
    logoImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/National_Cadet_Corps_%28India%29_Logo.svg/500px-National_Cadet_Corps_%28India%29_Logo.svg.png",
    accountHolder: "FLAVOUR BASE INDIA LLP",
    bankName: "State Bank of India CC A/c-1438",
    accountNo: "00000044504511438",
    ifscCode: "SBIN0064895",
  },
  {
    id: "COMP-004",
    name: "NATIONAL REFRESHMENT SUPPLIERS INDIA",
    address: "BLOCK C-2, OKHLA INDUSTRIAL AREA PHASE-I, NEW DELHI",
    pincode: "110020",
    fssaiNo: "10819001000921",
    gstinNo: "07AABCN8291M1Z1",
    stateName: "Delhi, Code: 07",
    email: "nationalrefreshment.delhi@gmail.com",
    logoImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Emblem_of_India.svg/300px-Emblem_of_India.svg.png",
    accountHolder: "FLAVOUR BASE INDIA LLP",
    bankName: "State Bank of India CC A/c-1438",
    accountNo: "00000044504511438",
    ifscCode: "SBIN0064895",
  },
];


const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper: Convert Amount to Indian Rupees (INR) Words
function numberToWordsINR(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "INR Zero Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  };

  const whole = Math.floor(num);
  const words = inWords(whole).trim();
  return `INR ${words} Only`;
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // Active Viewing Invoice Order State (for Invoice Generator view)
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<{
    schoolName: string;
    schoolCode: string;
    deliveryDate: string;
    invoiceNo: string;
    qty: number;
    rate: number;
    amount: number;
    unitName?: string;
  } | null>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("COMP-001");

  // Toggle QR Code Display Option
  const [showQrCode, setShowQrCode] = useState<boolean>(true);

  // Editable Invoice Form State (pre-populated with Company 1 defaults)
  const [invoiceForm, setInvoiceForm] = useState({
    companyName: ISSUING_COMPANIES[0].name,
    companyAddress: ISSUING_COMPANIES[0].address,
    companyPincode: ISSUING_COMPANIES[0].pincode,
    companyState: ISSUING_COMPANIES[0].stateName,
    companyEmail: ISSUING_COMPANIES[0].email,
    fssaiNo: ISSUING_COMPANIES[0].fssaiNo,
    gstinNo: ISSUING_COMPANIES[0].gstinNo,
    accountHolder: ISSUING_COMPANIES[0].accountHolder,
    bankName: ISSUING_COMPANIES[0].bankName,
    accountNo: ISSUING_COMPANIES[0].accountNo,
    ifscCode: ISSUING_COMPANIES[0].ifscCode,
    unitLogoImage: ISSUING_COMPANIES[0].logoImage,
    qrCodeImage: generateUpiQrUrl(0), // Placeholder, will be updated dynamically

    invoiceNo: "",
    date: "",
    deliveryNote: "-",
    paymentTerms: "Net 30 Days",
    refNoDate: "",
    dispatchDocNo: "",
    dispatchedThrough: "Govt. Transport",
    destination: "New Delhi",
    consigneeName: "",
    consigneeAddress: "253-254, Okhla Industrial Estate Phase 3 Rd, Okhla Phase III New Delhi South, DELHI, 110020",
    refName: "",
    refAddress: "",
    hsnCode: "996333",
    itemDescription: "Standard Refreshment Packet",
    qty: 61,
    rate: 71.43,
  });

  // Dynamic Date Scoping State
  const now = new Date();
  const [pickerYear, setPickerYear] = useState<number>(now.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(now.getMonth());
  const [showMonthPickerModal, setShowMonthPickerModal] = useState<boolean>(false);

  const selectedMonthString = selectedMonthIndex !== null
    ? `${MONTH_NAMES_FULL[selectedMonthIndex]} ${pickerYear}`
    : "All Months";

  // Filters State
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Options Populated from API
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [availableSchools, setAvailableSchools] = useState<string[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState<boolean>(false);

  // Single Core Fetch Function for Report Data
  const fetchReportData = useCallback(async (
    monthStr: string,
    unitsFilter: string[],
    schoolsFilter: string[],
    statusFilter: string,
    availUnitsCount: number = 0,
    availSchoolsCount: number = 0
  ) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (monthStr !== "All Months") {
        queryParams.append("month", monthStr);
      }
      if (unitsFilter.length > 0 && availUnitsCount > 0 && unitsFilter.length < availUnitsCount) {
        queryParams.append("units", unitsFilter.join(","));
      }
      if (schoolsFilter.length > 0 && availSchoolsCount > 0 && schoolsFilter.length < availSchoolsCount) {
        queryParams.append("schools", schoolsFilter.join(","));
      }
      if (statusFilter && statusFilter !== "All") {
        queryParams.append("status", statusFilter);
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/admin/reports?${queryString}` : "/api/admin/reports";

      let res = await authFetch(endpoint);
      if (!res.ok) {
        res = await authFetch("/api/admin/orders");
      }

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.groupedByUnit) {
            setReportData(json.data);
          } else if (Array.isArray(json.data)) {
            const orders = json.data;
            const totalRequisitions = orders.length;
            const totalQty = orders.reduce((sum: number, o: any) => sum + (o.totalQty || o.quantity || 0), 0);
            const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || o.amount || 0), 0);
            const settledCount = orders.filter((o: any) => o.status === "DELIVERED" || o.status === "SETTLED").length;
            const collectionRate = totalRequisitions > 0 ? `${Math.round((settledCount / totalRequisitions) * 100)}%` : "0%";

            const groupedByUnit: Record<string, ReportRow[]> = {};
            orders.forEach((order: any) => {
              const uName = order.unitName || order.unit?.name || order.unit || "Command Unit";
              if (!groupedByUnit[uName]) groupedByUnit[uName] = [];

              const qty = order.totalQty || order.quantity || 100;
              const amount = order.totalAmount || order.amount || 6400;
              const rate = qty > 0 ? amount / qty : 64;

              groupedByUnit[uName].push({
                schoolName: order.schoolName || order.school?.name || order.school || "School",
                schoolCode: order.schoolCode || order.school?.code || "SCH-001",
                deliveryDate: order.deliveryDate || "TBD",
                invoiceNo: order.invoiceNo || order.orderCode || `#INV-${order.id || 1001}`,
                qty,
                rate: Number(rate.toFixed(2)),
                amount,
              });
            });

            setReportData({
              reportingPeriod: monthStr,
              scope: "Delhi Directorate",
              kpis: {
                totalRequisitions,
                totalQty,
                totalRevenue,
                collectionRate,
              },
              groupedByUnit,
            });
          }
        }
      }
    } catch (err) {
      console.error("Admin Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Available Filter Options (Run Once on Mount)
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [uRes, sRes] = await Promise.all([
          authFetch("/api/admin/units"),
          authFetch("/api/admin/schools"),
        ]);

        let uList: string[] = [];
        let sList: string[] = [];

        if (uRes.ok) {
          const uJson = await uRes.json();
          if (uJson.success && Array.isArray(uJson.data)) {
            uList = uJson.data.map((u: any) => u.name);
          }
        }
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.success && Array.isArray(sJson.data)) {
            sList = sJson.data.map((s: any) => s.name);
          }
        }

        setAvailableUnits(uList);
        setSelectedUnits(uList);
        setAvailableSchools(sList);
        setSelectedSchools(sList);
        setOptionsLoaded(true);

        fetchReportData(selectedMonthString, uList, sList, selectedStatus, uList.length, sList.length);
      } catch (err) {
        console.error("Error loading filter options:", err);
        setOptionsLoaded(true);
        fetchReportData(selectedMonthString, [], [], selectedStatus, 0, 0);
      }
    }

    loadFilterOptions();
  }, [fetchReportData, selectedMonthString, selectedStatus]);

  // Handle Month Scoping Picker Save
  const handleApplyMonthPicker = () => {
    setShowMonthPickerModal(false);
    if (optionsLoaded) {
      fetchReportData(
        selectedMonthString,
        selectedUnits,
        selectedSchools,
        selectedStatus,
        availableUnits.length,
        availableSchools.length
      );
    }
  };

  const toggleUnit = (u: string) => {
    const updated = selectedUnits.includes(u)
      ? selectedUnits.filter((x) => x !== u)
      : [...selectedUnits, u];
    setSelectedUnits(updated);
  };

  const toggleSchool = (s: string) => {
    const updated = selectedSchools.includes(s)
      ? selectedSchools.filter((x) => x !== s)
      : [...selectedSchools, s];
    setSelectedSchools(updated);
  };

  const handleResetFilters = () => {
    setSelectedUnits(availableUnits);
    setSelectedSchools(availableSchools);
    setSelectedStatus("All");
    setSelectedMonthIndex(now.getMonth());
    setPickerYear(now.getFullYear());
    const defaultMonth = `${MONTH_NAMES_FULL[now.getMonth()]} ${now.getFullYear()}`;
    fetchReportData(defaultMonth, availableUnits, availableSchools, "All", availableUnits.length, availableSchools.length);
  };

  // Open Invoice Generator View for an Order (AUTO-GENERATED UNIQUE NON-EDITABLE INVOICE NO)
  const handleOpenInvoice = (item: ReportRow, unitName?: string) => {
    setViewingInvoiceOrder({ ...item, unitName });
    const computedRate = item.rate || 71.43;
    const computedQty = item.qty || 61;
    const dateFormatted = item.deliveryDate || `${now.getDate()}-${MONTH_NAMES_SHORT[now.getMonth()]}-${String(now.getFullYear()).slice(-2)}`;
    const computedAmount = computedQty * computedRate;

    const igstTax = computedAmount * 0.025;
    const sgstTax = computedAmount * 0.025;
    const totalAmountCalculated = computedAmount + igstTax + sgstTax;
    const roundedTotal = Math.round(totalAmountCalculated);

    // Auto-generate guaranteed unique Invoice No (e.g. NCC/25-26/INV-83921)
    const uniqueInvNo = item.invoiceNo && item.invoiceNo.startsWith("NCC")
      ? item.invoiceNo
      : `NCC/26-27/INV-${String(Date.now()).slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

    const comp = ISSUING_COMPANIES.find((c) => c.id === selectedCompanyId) || ISSUING_COMPANIES[0];

    setViewingInvoiceOrder({
      ...item,
      unitName,
      invoiceNo: uniqueInvNo,
      qty: computedQty,
      rate: computedRate,
      amount: computedQty * computedRate,
    });

    setInvoiceForm({
      companyName: comp.name,
      companyAddress: comp.address,
      companyPincode: comp.pincode,
      companyState: comp.stateName,
      companyEmail: comp.email,
      fssaiNo: comp.fssaiNo,
      gstinNo: comp.gstinNo,
      accountHolder: comp.accountHolder,
      bankName: comp.bankName,
      accountNo: comp.accountNo,
      ifscCode: comp.ifscCode,
      unitLogoImage: comp.logoImage,
      qrCodeImage: generateUpiQrUrl(roundedTotal),

      invoiceNo: uniqueInvNo,
      date: dateFormatted,
      deliveryNote: "-",
      paymentTerms: "Net 30 Days",
      refNoDate: `School: ${item.schoolName}`,
      dispatchDocNo: `DDN-${Math.floor(1000 + Math.random() * 9000)}`,
      dispatchedThrough: "Govt. Transport",
      destination: "New Delhi",
      consigneeName: unitName || "Command Unit",
      consigneeAddress: "253-254, Okhla Industrial Estate Phase 3 Rd, Okhla Phase III New Delhi South, DELHI, 110020",
      refName: item.schoolName || "School",
      refAddress: "253-254, Okhla Industrial Estate Phase 3 Rd, Okhla Phase III New Delhi South, DELHI, 110020",
      hsnCode: "996333",
      itemDescription: "Standard Refreshment Packet",
      qty: computedQty,
      rate: computedRate,
    });
  };


  // Handle Replaceable Unit Logo Image File Upload
  const handleUnitLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
        reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setInvoiceForm((prev) => ({
            ...prev,
            unitLogoImage: uploadEvent.target!.result as string,
          }));
        }
      };

      reader.onerror = () => {
        alert("Failed to read the selected image.");
      };

      reader.readAsDataURL(file);
    }
  };

  // Handle Replaceable Payment QR Image File Upload

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setInvoiceForm((prev) => ({
            ...prev,
            qrCodeImage: uploadEvent.target!.result as string,
          }));
        }
      };

      
      reader.onerror = () => {
        alert("Failed to read the selected image.");
      };
      reader.readAsDataURL(file);
    }
  };


  // Handle Select Company Preset Change
  const handleSelectCompany = (compID: string) => {
    setSelectedCompanyId(compID);
    const comp = ISSUING_COMPANIES.find((c) => c.id === compID) || ISSUING_COMPANIES[0];
    setInvoiceForm((prev) => ({
      ...prev,
      companyName: comp.name,
      companyAddress: comp.address,
      companyPincode: comp.pincode,
      companyState: comp.stateName,
      companyEmail: comp.email,
      fssaiNo: comp.fssaiNo,
      gstinNo: comp.gstinNo,
      accountHolder: comp.accountHolder,
      bankName: comp.bankName,
      accountNo: comp.accountNo,
      ifscCode: comp.ifscCode,
      unitLogoImage: comp.logoImage,
    }));
  };
  
  // Printable PDF Export Action Handler
  const handleDownloadPdf = async () => {
    const element = document.getElementById("tax-invoice-document");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY, // fixes offset-cut when page is scrolled
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.getElementById("tax-invoice-document");
        if (!clonedRoot) return;

        const fileInputs = clonedRoot.querySelectorAll('input[type="file"]' );

        fileInputs.forEach((input) => {input.remove();});


        const fields = clonedRoot.querySelectorAll("input:not([type='file']), textarea");
        fields.forEach((field) => {
          const el = field as HTMLInputElement | HTMLTextAreaElement;
          const replacement = document.createElement(
            el.tagName === "TEXTAREA" ? "div" : "span"
          );
          replacement.textContent = el.value || "";

          // carry over the classes so font, size, color, alignment stay identical
          replacement.className = el.className;

          // copy computed styles that matter but aren't in the className
          const computed = window.getComputedStyle(el);
          replacement.style.display = "inline-block";
          replacement.style.width = computed.width;
          replacement.style.textAlign = computed.textAlign;
          replacement.style.font = computed.font;
          replacement.style.color = computed.color;
          replacement.style.whiteSpace =
            el.tagName === "TEXTAREA" ? "pre-wrap" : "nowrap";

          el.replaceWith(replacement);
        });
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    const finalHeight = Math.min(imgHeight, pageHeight);
    const finalWidth =
      imgHeight > pageHeight ? (canvas.width * pageHeight) / canvas.height : pageWidth;

    pdf.addImage(imgData, "PNG", 0, 0, finalWidth, finalHeight, undefined, "FAST");
    pdf.save(`Tax-Invoice-${viewingInvoiceOrder?.invoiceNo || "order"}.pdf`);
  };

  // CSV Export Only
  const handleExport = (type: "csv") => {
    setExporting(true);
    setTimeout(() => {
      if (type === "csv") {
        let csvContent = "data:text/csv;charset=utf-8,School Name,School Code,Delivery Date,Invoice No,Qty,Rate (INR),Amount (INR)\n";
        if (reportData?.groupedByUnit) {
          Object.values(reportData.groupedByUnit).forEach((rows) => {
            rows.forEach((r) => {
              csvContent += `"${r.schoolName}","${r.schoolCode}","${r.deliveryDate}","${r.invoiceNo}",${r.qty},${r.rate},${r.amount}\n`;
            });
          });
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `NCC_Procurement_Report_${selectedMonthString.replace(/\s+/g, "_")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setExporting(false);
    }, 500);
  };

  // Calculations for Tax Invoice
  const taxableValue = invoiceForm.qty * invoiceForm.rate;
  const igstTax = taxableValue * 0.025;
  const sgstTax = taxableValue * 0.025;
  const totalAmountCalculated = taxableValue + igstTax + sgstTax;
  const roundedTotal = Math.round(totalAmountCalculated);
  const roundoffDiff = (roundedTotal - totalAmountCalculated).toFixed(3);
  const amountInWords = numberToWordsINR(roundedTotal);

  return (
    <div className="flex min-h-screen bg-paper font-sans">
      {/* Dynamic CSS Rules to isolate print to ONLY #tax-invoice-document with ZERO navbar whitespace */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden !important;
          }
          #tax-invoice-document,
          #tax-invoice-document * {
            visibility: visible !important;
          }
          #tax-invoice-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* SIDEBAR FILTER PANEL (Hidden when generating Invoice to cover full canvas width) */}
      {!viewingInvoiceOrder && (
        <aside className="w-[300px] flex-shrink-0 bg-ink-navy text-paper p-6 font-sans border-r border-hairline flex flex-col justify-between select-none no-print">
          <div className="space-y-6">
            <div className="border-b border-paper/10 pb-4">
              <span className="text-[10px] uppercase font-bold text-brass tracking-widest block mb-1 font-label-caps">
                Enterprise Control
              </span>
              <h2 className="font-headline-md text-xl font-bold text-paper">
                Report Controls
              </h2>
            </div>

            {/* Dynamic Month Scoping Control */}
            <div className="space-y-2">
              <label className="text-[10px] text-paper/60 uppercase tracking-widest font-bold block">
                Reporting Month Range
              </label>
              <div
                onClick={() => setShowMonthPickerModal(true)}
                className="bg-white/10 hover:bg-white/15 border border-paper/20 rounded p-3 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brass text-lg">calendar_month</span>
                  <span className="font-bold text-xs text-paper">{selectedMonthString}</span>
                </div>
                <span className="material-symbols-outlined text-paper/60 text-sm">edit</span>
              </div>
            </div>

            {/* Command Units Multi-select */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-paper/60 uppercase tracking-widest font-bold block">
                  Command Units
                </label>
                <span className="text-[10px] text-brass font-bold font-data-mono">
                  {selectedUnits.length}/{availableUnits.length}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto border border-white/20 rounded bg-white/5 p-2 space-y-1">
                {availableUnits.length === 0 ? (
                  <p className="text-[11px] text-paper/40 italic">Loading units...</p>
                ) : (
                  availableUnits.map((u) => (
                    <label
                      key={u}
                      className="flex items-center gap-2 p-1.5 text-[11px] hover:bg-white/5 rounded transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(u)}
                        onChange={() => toggleUnit(u)}
                        className="rounded-sm border-white/30 bg-transparent text-brass focus:ring-brass w-3 h-3 cursor-pointer"
                      />
                      <span className="truncate">{u}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Participating Schools Multi-select */}
            <div className="space-y-2">
              <label className="text-[10px] text-paper/60 uppercase tracking-widest font-bold block">
                Participating Schools
              </label>
              <div className="max-h-36 overflow-y-auto border border-white/20 rounded bg-white/5 p-2 space-y-1">
                {availableSchools.length === 0 ? (
                  <p className="text-[11px] text-paper/40 italic">Loading schools...</p>
                ) : (
                  availableSchools.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 p-1.5 text-[11px] hover:bg-white/5 rounded transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSchools.includes(s)}
                        onChange={() => toggleSchool(s)}
                        className="rounded-sm border-white/30 bg-transparent text-brass focus:ring-brass w-3 h-3 cursor-pointer"
                      />
                      <span className="truncate">{s}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Requisition Status Filter Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] text-paper/60 uppercase tracking-widest font-bold block">
                Requisition Status
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "All", val: "All" },
                  { label: "Delivered", val: "DELIVERED" },
                  { label: "Cancelled", val: "CANCELLED" },
                ].map((st) => (
                  <button
                    key={st.val}
                    type="button"
                    onClick={() => setSelectedStatus(st.val)}
                    className={`text-center px-2 py-1.5 rounded text-[11px] transition-colors font-bold uppercase cursor-pointer ${
                      selectedStatus === st.val
                        ? "border border-brass bg-brass/10 text-brass"
                        : "border border-white/20 bg-white/5 text-paper/80 hover:bg-white/10"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full mt-6 py-2.5 border border-paper/20 text-paper/60 font-bold uppercase tracking-widest text-[10px] hover:bg-paper/10 hover:text-paper transition-all rounded cursor-pointer"
          >
            Reset All Filters
          </button>
        </aside>
      )}

      {/* MAIN REPORT CANVAS CONTENT OR FULL-WIDTH TAX INVOICE VIEW */}
      <section className="flex-1 p-6 lg:p-10 bg-paper relative font-sans min-h-screen">
        {/* VIEW MODE 1: TAX INVOICE GENERATOR VIEW (FULL CANVAS COVERAGE) */}
        {viewingInvoiceOrder ? (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Top Invoice Action Bar with Company Selector & QR Toggle */}
            <div className="flex flex-wrap justify-between items-center bg-white border border-hairline p-4 rounded-lg shadow-sm gap-4 no-print">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewingInvoiceOrder(null)}
                  className="px-3.5 py-2 bg-paper hover:bg-hairline text-ink-navy rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1 border border-hairline cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Back to Reports</span>
                </button>
                <div>
                  <h2 className="font-bold text-ink-navy text-lg leading-none">
                    Tax Invoice Protocol
                  </h2>
                  <span className="text-[11px] text-steel font-medium">
                    Order for {viewingInvoiceOrder.schoolName} ({viewingInvoiceOrder.schoolCode})
                  </span>
                </div>
              </div>

              {/* Company Selector Dropdown & QR Toggle Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 4 ISSUING COMPANY DROPDOWN SELECTOR */}
                <div className="flex items-center gap-2 border-r border-hairline pr-3">
                  <label className="text-[11px] font-bold text-ink-navy uppercase">Issuing Company:</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleSelectCompany(e.target.value)}
                    className="bg-paper border border-hairline rounded px-3 py-1.5 text-xs font-bold text-ink-navy focus:outline-none focus:border-brass cursor-pointer"
                  >
                    {ISSUING_COMPANIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* QR CODE TOGGLE CHECKBOX */}
                <label className="flex items-center gap-1.5 text-xs font-bold text-ink-navy cursor-pointer bg-paper px-3 py-1.5 rounded border border-hairline">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="rounded-sm border-hairline text-brass focus:ring-brass w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Include Payment QR</span>
                </label>

                <button
                  onClick={() => setViewingInvoiceOrder(null)}
                  className="px-4 py-2 bg-alert-rust/10 hover:bg-alert-rust/20 text-alert-rust rounded font-bold text-xs uppercase tracking-wider border border-alert-rust/20 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="bg-brass text-white px-5 py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brass/90 transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* ISOLATED TAX INVOICE DOCUMENT CARD */}
            <div
              id="tax-invoice-document"
              className="bg-white border border-hairline p-12 rounded-lg shadow-md mx-auto space-y-10"
            >
              {/* Document Title */}
              <div className="text-center">
                <h1 className="font-headline-lg text-2xl font-bold text-ink-navy uppercase tracking-widest">
                  Tax Invoice
                </h1>
                <div className="w-24 h-1 bg-brass mx-auto mt-2"></div>
              </div>

              {/* Header Grid: Supplier Company & Invoice Details */}
              <div className="grid grid-cols-2 border border-hairline">
                {/* Company Details (Selected Company Auto-filled & Fully Editable) */}
                <div className="p-4 border-r border-hairline flex gap-4">
                  {/* Replaceable Company Logo */}
                  <div
                    className="w-20 h-20 rounded-full border border-brass flex items-center justify-center bg-paper shrink-0 relative overflow-hidden group shadow-2xs"
                    title="Click to Replace Company Logo / Emblem"
                  >
                    <img
                      src={invoiceForm.unitLogoImage}
                      alt="Company Logo"
                      className="w-full h-full object-contain p-1"
                    />
                    <label
                      htmlFor="company-logo-upload"
                      className="absolute inset-0 bg-ink-navy/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold uppercase p-1 text-center cursor-pointer no-print"
                    >
                      <span className="material-symbols-outlined text-xs">photo_camera</span>
                      <span>Change Logo</span>
                    </label>
                    <input
                      id="company-logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden no-print"
                      onChange={handleUnitLogoUpload}
                    />
                  </div>

                  {/* Fully Editable Company Address Header */}
                  <div className="flex-1 space-y-0.5">
                    <input
                      type="text"
                      value={invoiceForm.companyName}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
                      className="font-bold text-ink-navy text-xs uppercase w-full bg-transparent focus:outline-none border-b border-dashed border-hairline"
                    />
                    <input
                      type="text"
                      value={invoiceForm.companyAddress}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, companyAddress: e.target.value })}
                      className="text-[11px] text-steel w-full bg-transparent focus:outline-none border-b border-dashed border-hairline mt-1"
                    />
                    <div className="flex gap-2 text-[11px] text-steel pt-0.5">
                      <span>PIN:</span>
                      <input
                        type="text"
                        value={invoiceForm.companyPincode}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, companyPincode: e.target.value })}
                        className="font-data-mono font-bold bg-transparent focus:outline-none border-b border-dashed border-hairline w-16"
                      />
                      <span>State:</span>
                      <input
                        type="text"
                        value={invoiceForm.companyState}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, companyState: e.target.value })}
                        className="font-bold bg-transparent focus:outline-none border-b border-dashed border-hairline flex-1"
                      />
                    </div>
                    <div className="flex gap-1 text-[11px] text-steel">
                      <span>E-Mail:</span>
                      <input
                        type="text"
                        value={invoiceForm.companyEmail}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, companyEmail: e.target.value })}
                        className="font-bold bg-transparent focus:outline-none border-b border-dashed border-hairline flex-1 text-ink-navy"
                      />
                    </div>

                    <div className="mt-2 space-y-0.5 text-[11px]">
                      <p><span className="text-steel mr-1">FSSAI Lic:</span> <input type="text" value={invoiceForm.fssaiNo} onChange={(e) => setInvoiceForm({...invoiceForm, fssaiNo: e.target.value})} className="font-data-mono font-bold border-b border-dashed border-hairline bg-transparent focus:outline-none" /></p>
                      <p><span className="text-steel mr-1">GSTIN/UIN:</span> <input type="text" value={invoiceForm.gstinNo} onChange={(e) => setInvoiceForm({...invoiceForm, gstinNo: e.target.value})} className="font-data-mono font-bold border-b border-dashed border-hairline bg-transparent focus:outline-none" /></p>
                    </div>
                  </div>
                </div>

                {/* Invoice Meta Grid (Invoice No Unique & Non-editable) */}
                <div className="grid grid-cols-2 grid-rows-3 text-[11px]">
                  <div className="p-2 border-b border-r border-hairline">
                    <span className="text-steel uppercase block text-[9px] font-bold">Invoice No.</span>
                    <input
                      type="text"
                      readOnly
                      value={invoiceForm.invoiceNo}
                      className="font-data-mono font-bold w-full bg-transparent focus:outline-none border-b border-dashed border-hairline text-ink-navy cursor-not-allowed"
                      title="Auto-generated Unique Invoice Number"
                    />
                  </div>
                  <div className="p-2 border-b border-hairline">
                    <span className="text-steel uppercase block text-[9px] font-bold">Dated</span>
                    <input type="text" value={invoiceForm.date} onChange={(e) => setInvoiceForm({...invoiceForm, date: e.target.value})} className="font-data-mono font-bold w-full bg-transparent focus:outline-none border-b border-dashed border-hairline" />
                  </div>
                  <div className="p-2 border-b border-r border-hairline">
                    <span className="text-steel uppercase block text-[9px] font-bold">Delivery Note</span>
                    <input type="text" value={invoiceForm.deliveryNote} onChange={(e) => setInvoiceForm({...invoiceForm, deliveryNote: e.target.value})} className="font-data-mono w-full bg-transparent focus:outline-none" />
                  </div>
                  <div className="p-2 border-b border-hairline">
                    <span className="text-steel uppercase block text-[9px] font-bold">Mode/Terms of Payment</span>
                    <input type="text" value={invoiceForm.paymentTerms} onChange={(e) => setInvoiceForm({...invoiceForm, paymentTerms: e.target.value})} className="w-full bg-transparent focus:outline-none font-medium" />
                  </div>
                  <div className="p-2 border-r border-hairline">
                    <span className="text-steel uppercase block text-[9px] font-bold">Dispatch Doc No.</span>
                    <input type="text" value={invoiceForm.dispatchDocNo} onChange={(e) => setInvoiceForm({...invoiceForm, dispatchDocNo: e.target.value})} className="font-data-mono w-full bg-transparent focus:outline-none" />
                  </div>
                  <div className="p-2">
                    <span className="text-steel uppercase block text-[9px] font-bold">Destination</span>
                    <input type="text" value={invoiceForm.destination} onChange={(e) => setInvoiceForm({...invoiceForm, destination: e.target.value})} className="w-full bg-transparent focus:outline-none font-medium" />
                  </div>
                </div>
              </div>

              {/* Consignee & Buyer Section */}
              <div className="grid grid-cols-2 border-l border-r border-b border-hairline text-xs">
                <div className="p-4 border-r border-hairline">
                  <div className="space-y-0.5">
                  <span className="text-steel uppercase text-[9px] font-bold tracking-wider block">
                    Customer Details
                  </span>
                  <input
                    type="text"
                    value={invoiceForm.consigneeName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, consigneeName: e.target.value })}
                    className="font-bold text-ink-navy uppercase text-[11px] inline-block bg-transparent focus:outline-none border-b border-dashed border-hairline"
                  />
                </div>

                <div className="space-y-0.5">
                  <span className="text-steel uppercase text-[9px] font-bold tracking-wider block">
                    Billing Address
                  </span>
                  <textarea
                    rows={2}
                    value={invoiceForm.consigneeAddress}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, consigneeAddress: e.target.value })}
                    className="w-80 max-w-[400px] bg-transparent focus:outline-none text-ink-navy text-[11px] font-medium resize-none border-b border-dashed border-hairline pb-1 leading-snug"
                  />
                </div>

                </div>
                <div className="p-4 relative">
                  <div className="space-y-0.5">
                    <span className="text-steel uppercase text-[9px] font-bold tracking-wider block">
                      Shipping Address
                    </span>
                   <textarea
                    rows={2}
                    value={invoiceForm.refAddress}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, refAddress: e.target.value })}
                    className="w-80 max-w-[400px] bg-transparent focus:outline-none text-ink-navy text-[11px] font-medium resize-none border-b border-dashed border-hairline pb-1 leading-snug"
                  />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-steel uppercase text-[9px] font-bold tracking-wider block">
                      Reference
                    </span>
                    <input
                      type="text"
                      value={invoiceForm.refName}
                      size={Math.max(invoiceForm.refName.length + 2, 10)}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, refName: e.target.value })}
                      className="font-bold text-ink-navy text-[11px] w-full bg-transparent focus:outline-none border-b border-dashed border-hairline"
                    />
                  </div>
                  <div className="absolute top-4 right-4 border-2 border-brass rounded-full w-20 h-20 flex items-center justify-center rotate-12 opacity-80 pointer-events-none">
                    <div className="border border-brass rounded-full w-16 h-16 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-bold text-brass uppercase">Authorized</span>
                      <span className="text-[7px] text-brass font-bold">DISPATCHED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-hairline overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-paper/50 border-b border-hairline text-[10px] uppercase font-bold text-steel">
                    <tr>
                      <th className="p-3 w-10 text-center border-r border-hairline">Sl</th>
                      <th className="p-3 border-r border-hairline">Description of Services</th>
                      <th className="p-3 w-24 text-center border-r border-hairline">HSN/SAC</th>
                      <th className="p-3 w-24 text-right border-r border-hairline">Quantity</th>
                      <th className="p-3 w-24 text-right border-r border-hairline">Rate (₹)</th>
                      <th className="p-3 w-16 text-center border-r border-hairline">Per</th>
                      <th className="p-3 w-32 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top border-b border-hairline">
                      <td className="p-3 text-center border-r border-hairline font-data-mono font-bold">1</td>
                      <td className="p-3 border-r border-hairline">
                        <input type="text" value={invoiceForm.itemDescription} onChange={(e) => setInvoiceForm({...invoiceForm, itemDescription: e.target.value})} className="font-bold text-ink-navy w-full bg-transparent focus:outline-none" />
                        <div className="mt-4 space-y-1 text-[11px] italic text-steel">
                          <div>Output IGST@5%</div>
                          <div>Output SGST@5%</div>

                          <div>Roundoff</div>
                        </div>

                      </td>
                      <td className="p-3 text-center border-r border-hairline font-data-mono">
                        <input type="text" value={invoiceForm.hsnCode} onChange={(e) => setInvoiceForm({...invoiceForm, hsnCode: e.target.value})} className="text-center w-full bg-transparent focus:outline-none" />
                      </td>
                      <td className="p-3 text-right border-r border-hairline font-data-mono font-bold">
                        <input type="number" value={invoiceForm.qty} onChange={(e) => setInvoiceForm({...invoiceForm, qty: Number(e.target.value)})} className="text-right w-full bg-transparent focus:outline-none" /> nos
                      </td>
                      <td className="p-3 text-right border-r border-hairline font-data-mono">
                        <input type="number" step="0.01" value={invoiceForm.rate} onChange={(e) => setInvoiceForm({...invoiceForm, rate: Number(e.target.value)})} className="text-right w-full bg-transparent focus:outline-none font-bold" />
                      </td>
                      <td className="p-3 text-center border-r border-hairline text-steel">nos</td>
                      <td className="p-3 text-right font-data-mono font-bold">
                        <div>₹{taxableValue.toFixed(2)}</div>
                        <div className="mt-4 space-y-1 font-normal text-steel">
                          <div>₹{igstTax.toFixed(2)}</div>
                          <div>₹{sgstTax.toFixed(2)}</div>
                          <div>({roundoffDiff})</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-paper/30 font-data-mono font-bold">
                    <tr>
                      <td colSpan={3} className="p-3 text-right uppercase text-steel font-sans text-[10px]">Total</td>
                      <td className="p-3 text-right border-r border-hairline">{invoiceForm.qty} nos</td>
                      <td colSpan={2} className="border-r border-hairline"></td>
                      <td className="p-3 text-right text-brass text-sm bg-brass/10 border-t-2 border-brass">
                        ₹{roundedTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="border-b border-hairline pb-3 text-xs space-y-1">
                <span className="text-steel uppercase text-[10px] font-bold block">Amount Chargeable (in words)</span>
                <p className="font-bold text-ink-navy uppercase">{amountInWords}</p>
              </div>

              {/* Bank Details, Replaceable Payment QR Code (Optional) & Signature Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-hairline text-xs font-sans">
                {/* Company Bank Details (Updated automatically based on selected Company) */}
                <div className="flex gap-4 items-start border-r border-hairline pr-4">
                  {/* Optional QR Code Box with Replaceable Upload */}
                  {showQrCode && (
                    <div className="w-24 flex flex-col items-center shrink-0">
                      <label
                        htmlFor="qr-image-upload"
                        className="w-20 h-20 border border-hairline p-1 bg-white relative cursor-pointer group hover:border-brass transition-all rounded shadow-2xs overflow-hidden flex items-center justify-center"
                        title="Click to Replace Payment QR Code / Image"
                      >
                        <img
                          src={invoiceForm.qrCodeImage}
                          alt="Scan to Pay QR Code"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-ink-navy/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold uppercase p-1 text-center no-print">
                          <span className="material-symbols-outlined text-xs">photo_camera</span>
                          <span>Replace QR</span>
                        </div>
                      </label>
                      <input
                        id="qr-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden no-print"
                        onChange={handleQrImageUpload}
                      />
                      <span className="text-[9px] font-bold text-steel uppercase mt-1 tracking-wider text-center">
                        Scan to Pay
                      </span>
                    </div>
                  )}

                  {/* Fully Editable Company Bank Details Table */}
                  <div className="flex-1 space-y-1">
                    <span className="text-steel uppercase text-[10px] font-bold underline block mb-1">
                      Company Bank Details
                    </span>

                    <table className="w-full text-[11px]">
                      <tbody>
                        <tr>
                          <td className="text-steel w-24 py-0.5">A/c Holder</td>
                          <td className="py-0.5">
                            <span>: </span>
                            <input
                              type="text"
                              value={invoiceForm.accountHolder}
                              onChange={(e) =>
                                setInvoiceForm({
                                  ...invoiceForm,
                                  accountHolder: e.target.value,
                                })
                              }
                              size={Math.max(invoiceForm.accountHolder.length + 2, 1)}
                              className="font-bold bg-transparent focus:outline-none border-0 border-b border-dashed border-hairline p-0 m-0"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="text-steel py-0.5">Bank Name</td>
                          <td className="py-0.5">
                            <span>: </span>
                            <input
                              type="text"
                              value={invoiceForm.bankName}
                              onChange={(e) =>
                                setInvoiceForm({
                                  ...invoiceForm,
                                  bankName: e.target.value,
                                })
                              }
                              size={Math.max(invoiceForm.bankName.length, 1)}
                              className="font-bold bg-transparent focus:outline-none border-0 border-b border-dashed border-hairline p-0 m-0"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="text-steel py-0.5">A/c No.</td>
                          <td className="py-0.5">
                            <span>: </span>
                            <input
                              type="text"
                              value={invoiceForm.accountNo}
                              onChange={(e) =>
                                setInvoiceForm({
                                  ...invoiceForm,
                                  accountNo: e.target.value,
                                })
                              }
                              size={Math.max(invoiceForm.accountNo.length, 1)}
                              className="font-data-mono font-bold bg-transparent focus:outline-none border-0 border-b border-dashed border-hairline p-0 m-0"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="text-steel py-0.5">IFS Code</td>
                          <td className="py-0.5">
                            <span>: </span>
                            <input
                              type="text"
                              value={invoiceForm.ifscCode}
                              onChange={(e) =>
                                setInvoiceForm({
                                  ...invoiceForm,
                                  ifscCode: e.target.value,
                                })
                              }
                              size={Math.max(invoiceForm.ifscCode.length, 1)}
                              className="font-data-mono font-bold bg-transparent focus:outline-none border-0 border-b border-dashed border-hairline p-0 m-0"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Declaration & Company Authorised Signatory Footer */}
                <div className="flex flex-col justify-between text-right">
                  <div>
                    <span className="text-steel uppercase text-[10px] font-bold block mb-1">Declaration</span>
                    <p className="text-[10px] text-steel italic leading-tight">
                      We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                    </p>
                  </div>
                  <div className="mt-8">
                    {/* Authorised Signatory for Selected Company */}
                    <p className="text-[10px] text-steel font-bold uppercase mb-6">
                      for {invoiceForm.companyName || "FLAVOUR BASE INDIA LLP"}
                    </p>
                    <p className="font-bold text-ink-navy text-xs border-t border-hairline pt-1 inline-block">
                      Authorised Signatory
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (

          /* VIEW MODE 2: DEFAULT MONTHLY REQUISITION REPORT REGISTER */
          <>
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h1 className="font-headline-md text-3xl md:text-4xl text-ink-navy font-bold">
                  Monthly Requisition Report
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-steel text-xs mt-2 font-sans">
                  <span className="material-symbols-outlined text-sm text-brass">calendar_month</span>
                  <span className="font-bold text-ink-navy">Reporting Period: {selectedMonthString}</span>
                  <span className="mx-1">•</span>
                  <span className="material-symbols-outlined text-sm text-steel">domain</span>
                  <span>Scope: {reportData?.scope || "Delhi Directorate"}</span>
                </div>
              </div>

              {/* Action Toolbar: CSV Export Only */}
              <div className="flex items-center gap-3">
                {loading && (
                  <span className="text-xs text-brass font-data-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
                    Syncing Reports API...
                  </span>
                )}
                <button
                  disabled={exporting}
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brass text-white rounded font-bold text-xs hover:bg-brass/90 transition-colors uppercase tracking-wider font-sans shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  {exporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>
            </div>

            {/* HIGH-PERFORMANCE KPI CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 font-sans">
              {/* Card 1: Total Requisitions */}
              <div className="bg-white border border-hairline p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-steel uppercase font-bold tracking-widest">
                    Total Requisitions
                  </span>
                  <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center text-brass">
                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-data-mono text-2xl font-bold text-ink-navy tracking-tight">
                    {loading ? "..." : reportData?.kpis.totalRequisitions ?? 0}
                  </div>
                  <p className="text-[11px] text-settled-green font-semibold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-settled-green animate-pulse"></span>
                    Active Requisition Orders
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brass"></div>
              </div>

              {/* Card 2: Total Quantity */}
              <div className="bg-white border border-hairline p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-steel uppercase font-bold tracking-widest">
                    Total Quantity
                  </span>
                  <div className="w-8 h-8 rounded-full bg-delivery-blue/10 flex items-center justify-center text-delivery-blue">
                    <span className="material-symbols-outlined text-lg">deployed_code</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-data-mono text-2xl font-bold text-ink-navy tracking-tight">
                    {loading ? "..." : (reportData?.kpis.totalQty ?? 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-[11px] text-steel font-medium mt-1">
                    Packets Dispatched / Due
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-delivery-blue"></div>
              </div>

              {/* Card 3: Revenue Settled */}
              <div className="bg-white border border-hairline p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-steel uppercase font-bold tracking-widest">
                    Total Revenue
                  </span>
                  <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center text-brass">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-data-mono text-2xl font-bold text-brass tracking-tight">
                    ₹{loading ? "..." : (reportData?.kpis.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-settled-green font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Verified Procurement Value
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brass"></div>
              </div>

              {/* Card 4: Collection Rate */}
              <div className="bg-white border border-hairline p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-steel uppercase font-bold tracking-widest">
                    Collection Rate
                  </span>
                  <div className="w-8 h-8 rounded-full bg-settled-green/10 flex items-center justify-center text-settled-green">
                    <span className="material-symbols-outlined text-lg">percent</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-data-mono text-2xl font-bold text-settled-green tracking-tight">
                    {loading ? "..." : reportData?.kpis.collectionRate ?? "0%"}
                  </div>
                  <p className="text-[11px] text-steel font-medium mt-1">
                    Settlement Efficiency
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-settled-green"></div>
              </div>
            </div>

            {/* THE REGISTER DATA TABLE */}
            <div className="bg-white border border-hairline rounded overflow-hidden relative shadow-sm">

              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-paper/60 border-b border-hairline">
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider">
                      School Name / Code
                    </th>
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider">
                      Deliv. Date
                    </th>
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider">
                      Invoice No.
                    </th>
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider text-right">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider text-right">
                      Rate
                    </th>
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-[10px] text-steel font-bold uppercase tracking-wider text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-steel italic">
                        Loading audit report records...
                      </td>
                    </tr>
                  ) : !reportData || Object.keys(reportData.groupedByUnit).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-steel italic">
                        No requisition report records match your filter criteria for {selectedMonthString}.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(reportData.groupedByUnit).map(([unitName, unitItems]) => {
                      const unitSubtotalQty = unitItems.reduce((acc, i) => acc + i.qty, 0);
                      const unitSubtotalAmount = unitItems.reduce((acc, i) => acc + i.amount, 0);

                      return (
                        <React.Fragment key={unitName}>
                          {/* Unit Header Row */}
                          <tr className="bg-paper/50 border-b border-hairline">
                            <td colSpan={7} className="px-6 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-brass text-sm">
                                  shield
                                </span>
                                <span className="font-bold text-ink-navy uppercase tracking-wider text-[11px]">
                                  UNIT: {unitName}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* School Item Rows with "Invoice" Action Button */}
                          {unitItems.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-paper/20 transition-colors border-b border-hairline"
                            >
                              <td className="px-6 py-4">
                                <div className="font-semibold text-ink-navy text-sm">
                                  {item.schoolName}
                                </div>
                                <div className="text-[11px] text-steel font-data-mono uppercase mt-0.5">
                                  {item.schoolCode}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-data-mono text-xs text-steel">
                                {item.deliveryDate}
                              </td>
                              <td className="px-6 py-4 font-data-mono text-xs text-ink-navy font-bold">
                                {item.invoiceNo}
                              </td>
                              <td className="px-6 py-4 font-data-mono text-xs text-right font-bold">
                                {item.qty}
                              </td>
                              <td className="px-6 py-4 font-data-mono text-xs text-right text-steel">
                                ₹{item.rate.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 font-data-mono text-xs text-right font-bold text-ink-navy">
                                ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 text-center">
                              {(() => {
                                // Check if the order status is DELIVERED or SETTLED
                                const isDelivered =
                                  item.status === "DELIVERED" || item.status === "SETTLED";

                                if (isDelivered) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInvoice(item, unitName)}
                                      className="px-3 py-1 bg-brass/10 hover:bg-brass text-brass hover:text-white border border-brass/30 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                      title="Generate / View Tax Invoice"
                                    >
                                      Invoice
                                    </button>
                                  );
                                }

                                // For non-delivered orders (PENDING, CANCELLED, etc.)
                                return (
                                  <span
                                    className="px-2.5 py-1 bg-paper text-steel/60 border border-hairline rounded text-[10px] font-bold uppercase tracking-wider cursor-not-allowed inline-block select-none"
                                    title="Tax Invoice will be available once order is Delivered"
                                  >
                                    {item.status || "Pending"}
                                  </span>
                                );
                              })()}
                            </td>
                            </tr>
                          ))}

                          {/* Unit Subtotal Row */}
                          <tr className="bg-paper/30 font-sans border-b border-hairline">
                            <td
                              colSpan={3}
                              className="px-6 py-2.5 text-right text-[11px] text-steel uppercase font-bold tracking-wider italic"
                            >
                              Subtotal ({unitName}):
                            </td>
                            <td className="px-6 py-2.5 text-right font-data-mono text-xs font-bold text-ink-navy">
                              {unitSubtotalQty}
                            </td>
                            <td className="px-6 py-2.5"></td>
                            <td className="px-6 py-2.5 text-right font-data-mono text-xs font-bold text-brass">
                              ₹{unitSubtotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-2.5"></td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* MONTH SCOPING PICKER MODAL */}
      {showMonthPickerModal && (
        <>
          <div
            onClick={() => setShowMonthPickerModal(false)}
            className="fixed inset-0 bg-ink-navy/40 backdrop-blur-sm z-[60] transition-opacity no-print"
          ></div>
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-sans no-print">
            <div className="bg-white border border-hairline max-w-md w-full p-6 rounded-lg shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brass">calendar_month</span>
                  <h3 className="font-headline font-bold text-lg text-ink-navy">
                    Select Reporting Period
                  </h3>
                </div>
                <button
                  onClick={() => setShowMonthPickerModal(false)}
                  className="text-steel hover:text-ink-navy text-xl cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Year Selector */}
              <div className="flex items-center justify-between bg-paper p-3 rounded border border-hairline">
                <span className="text-xs text-steel uppercase font-bold tracking-wider">
                  Target Fiscal Year:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1 hover:bg-brass/20 text-ink-navy rounded font-bold"
                  >
                    ‹
                  </button>
                  <span className="font-data-mono font-bold text-sm text-brass">
                    {pickerYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1 hover:bg-brass/20 text-ink-navy rounded font-bold"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Month Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs text-steel uppercase font-bold tracking-wider block">
                  Select Month:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonthIndex(null)}
                    className={`p-2.5 rounded text-xs font-bold transition-all border ${
                      selectedMonthIndex === null
                        ? "bg-brass text-white border-brass shadow-sm"
                        : "bg-paper text-ink-navy hover:bg-brass/10 border-hairline"
                    }`}
                  >
                    All Months
                  </button>
                  {MONTH_NAMES_SHORT.map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMonthIndex(idx)}
                      className={`p-2.5 rounded text-xs font-bold transition-all border ${
                        selectedMonthIndex === idx
                          ? "bg-ink-navy text-white border-ink-navy shadow-sm"
                          : "bg-paper text-ink-navy hover:bg-brass/10 border-hairline"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowMonthPickerModal(false)}
                  className="flex-1 py-2.5 bg-paper text-steel hover:text-ink-navy font-bold text-xs uppercase tracking-wider rounded border border-hairline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyMonthPicker}
                  className="flex-1 py-2.5 bg-brass hover:bg-brass/90 text-white font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
