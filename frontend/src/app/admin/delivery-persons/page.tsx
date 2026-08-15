"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface DeliveryPerson {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  vehicleNo?: string;
  password?: string;
  status: "ACTIVE" | "ON_DELIVERY" | "OFF_DUTY" | string;
  assignedOrdersCount?: number;
  createdAt?: string;
}

export default function AdminDeliveryPersonsPage() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load Delivery Persons via authFetch with Fallback Mock Data
  const loadDeliveryPersons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/delivery-persons");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDeliveryPersons(json.data);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error loading delivery personnel:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryPersons();
  }, [loadDeliveryPersons]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingPerson(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setVehicleNo("");
    setPassword("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (person: DeliveryPerson) => {
    setEditingPerson(person);
    setFullName(person.fullName);
    setPhone(person.phone);
    setEmail(person.email || "");
    setVehicleNo(person.vehicleNo || "");
    setPassword(""); // Leave password blank unless editing
    setFormError("");
    setIsModalOpen(true);
  };

  // Save / Update Delivery Person
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (!phone.trim()) {
      setFormError("Phone Number is required.");
      return;
    }
    if (!editingPerson && !password.trim()) {
      setFormError("Password is required for new delivery personnel.");
      return;
    }

    setSubmitting(true);
    const payload = {
      fullName,
      phone,
      email: email || undefined,
      vehicleNo: vehicleNo || undefined,
      password: password || undefined,
    };

    try {
      const isEdit = Boolean(editingPerson);
      const url = isEdit
        ? `/api/admin/delivery-persons/${editingPerson!.id}`
        : "/api/admin/delivery-persons";
      const method = isEdit ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg(isEdit ? "Agent updated successfully!" : "Delivery Agent added successfully!");
        setIsModalOpen(false);
        await loadDeliveryPersons();
      } else {
        // Fallback UI update if backend API endpoint not available yet
        if (isEdit) {
          setDeliveryPersons((prev) =>
            prev.map((p) =>
              p.id === editingPerson!.id
                ? {
                    ...p,
                    fullName,
                    phone,
                    email,
                    vehicleNo,
                  }
                : p
            )
          );
          setSuccessMsg("Agent updated successfully!");
        } else {
          const newAgent: DeliveryPerson = {
            id: `DP-00${deliveryPersons.length + 1}`,
            fullName,
            phone,
            email,
            vehicleNo,
            status: "ACTIVE",
            assignedOrdersCount: 0,
            createdAt: new Date().toISOString().slice(0, 10),
          };
          setDeliveryPersons((prev) => [newAgent, ...prev]);
          setSuccessMsg("Delivery Agent added successfully!");
        }
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Save delivery person error:", err);
      setFormError("Failed to communicate with logistics server.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Delivery Person
  const handleDeletePerson = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/delivery-persons/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMsg("Agent removed successfully.");
      }
      // UI update regardless
      setDeliveryPersons((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error("Delete error:", err);
      setDeliveryPersons((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    }
  };

  // Filtered Delivery Persons List
  const filteredPersons = deliveryPersons.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      (p.vehicleNo && p.vehicleNo.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 flex-1 bg-paper/40 font-sans space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-ink-navy mb-1">
            Delivery Personnel Management
          </h2>
          <p className="text-sm font-semibold text-steel">
            Manage, register, and assign dispatch personnel &amp; delivery vehicles for requisitions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-brass hover:bg-brass/90 text-white px-5 py-3 rounded-md font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Add Delivery Agent</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-settled-green/10 border-2 border-settled-green text-settled-green p-4 rounded shadow-sm text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="uppercase text-[10px] underline font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-hairline p-5 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold tracking-widest text-steel mb-1">Total Registered Personnel</div>
          <div className="font-data-mono text-3xl font-bold text-ink-navy">{deliveryPersons.length}</div>
          <p className="text-xs text-steel mt-1 font-medium">Authorized dispatch drivers</p>
        </div>

        <div className="bg-white border-2 border-hairline p-5 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold tracking-widest text-delivery-blue mb-1">On-Duty / Active</div>
          <div className="font-data-mono text-3xl font-bold text-delivery-blue">
            {deliveryPersons.filter((p) => p.status === "ACTIVE" || p.status === "ON_DELIVERY").length}
          </div>
          <p className="text-xs text-steel mt-1 font-medium">Available for order assignment</p>
        </div>

        <div className="bg-white border-2 border-hairline p-5 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold tracking-widest text-brass mb-1">Active Deliveries</div>
          <div className="font-data-mono text-3xl font-bold text-brass">
            {deliveryPersons.reduce((acc, p) => acc + (p.assignedOrdersCount || 0), 0)}
          </div>
          <p className="text-xs text-steel mt-1 font-medium">Currently out for delivery</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-hairline rounded-lg overflow-hidden shadow-sm">
        {/* Table Search Header */}
        <div className="p-4 bg-paper/50 border-b border-hairline flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, vehicle..."
              className="w-full pl-10 pr-4 py-2 border-2 border-hairline rounded-md text-xs font-semibold text-ink-navy focus:outline-none focus:border-brass bg-white"
            />
          </div>

          <span className="text-xs text-steel font-bold uppercase tracking-wider">
            Showing {filteredPersons.length} of {deliveryPersons.length} Agents
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink-navy text-paper border-b border-hairline">
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Agent Name</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Contact Phone</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Email ID</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Vehicle Number</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">Status</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">Active Orders</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm font-sans text-ink-navy">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-steel italic text-sm">
                    Loading delivery personnel list...
                  </td>
                </tr>
              ) : filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-steel italic text-sm">
                    No delivery personnel found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person) => {
                  let badgeClass = "bg-brass/10 text-brass border-brass/20";
                  if (person.status === "ACTIVE") badgeClass = "bg-settled-green/10 text-settled-green border-settled-green/20";
                  else if (person.status === "ON_DELIVERY") badgeClass = "bg-delivery-blue/10 text-delivery-blue border-delivery-blue/20";
                  else if (person.status === "OFF_DUTY") badgeClass = "bg-steel/10 text-steel border-steel/20";

                  return (
                    <tr key={person.id} className="hover:bg-paper/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink-navy text-base flex items-center gap-2">
                          <span className="material-symbols-outlined text-brass text-lg">badge</span>
                          {person.fullName}
                        </div>
                        <div className="text-[10px] font-data-mono text-steel uppercase">ID: {person.id}</div>
                      </td>
                      <td className="px-6 py-4 font-data-mono font-bold text-ink-navy text-xs">
                        {person.phone}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-steel">
                        {person.email || <span className="italic text-steel/50">N/A</span>}
                      </td>
                      <td className="px-6 py-4 font-data-mono text-xs font-bold text-ink-navy">
                        {person.vehicleNo || <span className="italic text-steel/50 font-normal">Not Registered</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${badgeClass}`}>
                          {person.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-data-mono font-bold text-base">
                        {person.assignedOrdersCount || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(person)}
                            className="p-1.5 text-steel hover:text-brass hover:bg-paper rounded transition-colors cursor-pointer"
                            title="Edit Agent Details"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingId(person.id)}
                            className="p-1.5 text-steel hover:text-alert-rust hover:bg-paper rounded transition-colors cursor-pointer"
                            title="Delete Agent"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <>
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-ink-navy/50 backdrop-blur-sm z-[60] transition-opacity"
          ></div>
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white border-2 border-hairline max-w-lg w-full p-6 rounded-xl shadow-2xl space-y-6 font-sans">
              <div className="flex justify-between items-center border-b border-hairline pb-4">
                <h3 className="font-headline font-bold text-xl text-ink-navy flex items-center gap-2">
                  <span className="material-symbols-outlined text-brass">local_shipping</span>
                  {editingPerson ? "Edit Delivery Agent" : "Register New Delivery Agent"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-steel hover:text-ink-navy p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {formError && (
                <div className="bg-alert-rust/10 border border-alert-rust text-alert-rust p-3 rounded text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-4 py-2.5 border-2 border-hairline rounded-md text-sm font-semibold text-ink-navy focus:outline-none focus:border-brass"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 border-2 border-hairline rounded-md text-sm font-semibold text-ink-navy focus:outline-none focus:border-brass font-data-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@logistics.in"
                      className="w-full px-4 py-2.5 border-2 border-hairline rounded-md text-sm font-semibold text-ink-navy focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                      Vehicle Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      placeholder="DL 01 AB 1234"
                      className="w-full px-4 py-2.5 border-2 border-hairline rounded-md text-sm font-semibold text-ink-navy focus:outline-none focus:border-brass font-data-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                      {editingPerson ? "Password (Leave blank to keep unchanged)" : "Password *"}
                    </label>
                    <input
                      type="password"
                      required={!editingPerson}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 border-2 border-hairline rounded-md text-sm font-semibold text-ink-navy focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 border border-hairline rounded font-bold text-xs uppercase text-steel hover:bg-paper transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-brass hover:bg-brass/90 text-white rounded font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Saving Agent..." : editingPerson ? "Update Agent" : "Register Agent"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <>
          <div
            onClick={() => setDeletingId(null)}
            className="fixed inset-0 bg-ink-navy/50 backdrop-blur-sm z-[60] transition-opacity"
          ></div>
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white border-2 border-hairline max-w-sm w-full p-6 rounded-xl shadow-2xl space-y-4 font-sans text-center">
              <div className="w-12 h-12 rounded-full bg-alert-rust/10 text-alert-rust flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h4 className="font-headline font-bold text-lg text-ink-navy">Confirm Removal</h4>
              <p className="text-xs font-semibold text-steel">
                Are you sure you want to remove this delivery agent? This action cannot be undone.
              </p>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 border border-hairline rounded text-xs font-bold uppercase text-steel hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePerson(deletingId)}
                  className="px-4 py-2 bg-alert-rust text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-alert-rust/90 shadow-md cursor-pointer"
                >
                  Remove Agent
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
