"use client";

import React, { useState } from "react";

// TODO: API Integration - Replace mock template configs with GET /api/admin/customization-templates
const initialTemplates = [
  {
    id: "TMPL-101",
    skuName: "Institutional Cotton Polo Shirt",
    baseImageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    printZone: { x: 35, y: 38, width: 30, fontSize: 16, color: "#FFFFFF" },
    previewSampleText: "AARAV SHARMA",
  },
  {
    id: "TMPL-102",
    skuName: "Embroidered Woolen Cap",
    baseImageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80",
    printZone: { x: 40, y: 45, width: 20, fontSize: 14, color: "#F5BC6C" },
    previewSampleText: "DPS 2026",
  },
];

export default function CustomizationTemplatesPage() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTmpl, setSelectedTmpl] = useState(initialTemplates[0]);

  const handleUpdateZone = (field: string, val: number | string) => {
    const updated = {
      ...selectedTmpl,
      printZone: { ...selectedTmpl.printZone, [field]: val },
    };
    setSelectedTmpl(updated);
    setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="p-container-padding flex-1">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h3 className="font-display-lg text-display-lg text-primary">Customization Template Engine</h3>
          <p className="text-on-surface-variant font-body-md italic mt-1">
            Configure 2D print-zone coordinates on SKU base mockups to render live personalization previews for School Admins &amp; Students.
          </p>
        </div>
        <button
          onClick={() => {
            // TODO: API Integration - Call PUT /api/admin/customization-templates/:id
            alert(`Template ${selectedTmpl.id} print-zone coordinates saved!`);
          }}
          className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2 hover:bg-primary-container/90 font-label-caps uppercase text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          Save Print Zone Config
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Left Column: Template Selection & Coordinate Sliders */}
        <div className="col-span-12 lg:col-span-5 space-y-gutter">
          <div className="bg-white border border-outline-variant p-6">
            <h5 className="font-headline-md text-primary mb-3">Select SKU Base Template</h5>
            <select
              value={selectedTmpl.id}
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) setSelectedTmpl(found);
              }}
              className="w-full bg-surface-container-low border border-outline-variant p-2 text-xs font-body-md"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.skuName} ({t.id})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-outline-variant p-6 space-y-4">
            <h5 className="font-headline-md text-primary pb-2 border-b border-outline-variant">
              Print Zone Position &amp; Typography
            </h5>

            <div>
              <div className="flex justify-between text-xs font-data-mono mb-1">
                <span>Horizontal Offset (X Position):</span>
                <span>{selectedTmpl.printZone.x}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedTmpl.printZone.x}
                onChange={(e) => handleUpdateZone("x", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-data-mono mb-1">
                <span>Vertical Offset (Y Position):</span>
                <span>{selectedTmpl.printZone.y}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedTmpl.printZone.y}
                onChange={(e) => handleUpdateZone("y", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-data-mono mb-1">
                <span>Font Size:</span>
                <span>{selectedTmpl.printZone.fontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="36"
                value={selectedTmpl.printZone.fontSize}
                onChange={(e) => handleUpdateZone("fontSize", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-data-mono mb-1">Text Color:</label>
              <input
                type="color"
                value={selectedTmpl.printZone.color}
                onChange={(e) => handleUpdateZone("color", e.target.value)}
                className="h-8 w-16 p-0 border border-outline-variant cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-data-mono mb-1">Sample Text Preview:</label>
              <input
                type="text"
                value={selectedTmpl.previewSampleText}
                onChange={(e) => handleUpdateZone("previewSampleText", e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant p-2 text-xs font-data-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: 2D Live Mockup Canvas */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-outline-variant p-6 flex flex-col items-center justify-center">
          <h5 className="font-label-caps text-xs uppercase text-on-surface-variant tracking-widest mb-4">
            Live 2D Print Zone Canvas Rendering
          </h5>

          <div className="relative w-[360px] h-[360px] border border-outline-variant bg-surface-container-highest overflow-hidden shadow-lg">
            <img
              src={selectedTmpl.baseImageUrl}
              alt="SKU Base Mockup"
              className="w-full h-full object-cover"
            />

            {/* Print Zone Text Overlay */}
            <div
              className="absolute font-data-mono font-bold tracking-wider pointer-events-none text-center transform -translate-x-1/2 -translate-y-1/2 border border-dashed border-tertiary-fixed-dim/60 p-1"
              style={{
                left: `${selectedTmpl.printZone.x}%`,
                top: `${selectedTmpl.printZone.y}%`,
                fontSize: `${selectedTmpl.printZone.fontSize}px`,
                color: selectedTmpl.printZone.color,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {selectedTmpl.previewSampleText || "STUDENT NAME"}
            </div>
          </div>

          <p className="text-[11px] font-body-md text-on-surface-variant italic mt-4 text-center max-w-sm">
            This live overlay rules engine directly powers the student name &amp; size preview displayed to School Admins during order entry and Students in their view-only portal.
          </p>
        </div>
      </div>
    </div>
  );
}
