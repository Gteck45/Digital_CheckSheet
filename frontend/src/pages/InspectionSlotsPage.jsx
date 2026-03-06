import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Clock,
} from "lucide-react";

import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

/* ===============================
   MODAL (Themed)
================================*/

const SlotModal = ({ open, onClose, slot, refresh }) => {
  const [form, setForm] = useState({
    slot_id: "",
    shift: "A",
    start_time: "",
    end_time: "",
    fill_window: 120,
    grace_period: 10,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (slot) {
      setForm({
        slot_id: slot.slot_id || "",
        shift: slot.shift || "A",
        start_time: String(slot.start_time || "").slice(0, 5),
        end_time: String(slot.end_time || "").slice(0, 5),
        fill_window: slot.fill_window ?? 120,
        grace_period: slot.grace_period ?? 10,
      });
    } else {
      setForm({
        slot_id: "",
        shift: "A",
        start_time: "",
        end_time: "",
        fill_window: 120,
        grace_period: 10,
      });
    }
  }, [slot, open]);

  const validate = () => {
    const e = {};
    if (!form.slot_id.trim()) e.slot_id = "Slot ID is required";
    if (!form.shift) e.shift = "Shift is required";
    if (!form.start_time) e.start_time = "Start time is required";
    if (!form.end_time) e.end_time = "End time is required";
    if (Number(form.fill_window) < 0) e.fill_window = "Invalid fill window";
    if (Number(form.grace_period) < 0) e.grace_period = "Invalid grace period";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        fill_window: Number(form.fill_window),
        grace_period: Number(form.grace_period),
      };

      if (slot) {
        await apiService.put(endpoints.inspectionSlots.update(slot.id), payload);
        toast.success("Slot updated successfully");
      } else {
        await apiService.post(endpoints.inspectionSlots.create, payload);
        toast.success("Slot created successfully");
      }

      refresh();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save slot");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900/40 dark:text-white">
          <h2 className="text-lg font-semibold">
            {slot ? "Edit Inspection Slot" : "Add Inspection Slot"}
          </h2>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Slot ID</label>
              <input
                value={form.slot_id}
                onChange={(e) => setForm({ ...form, slot_id: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.slot_id ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="TS1, TS2..."
              />
              {errors.slot_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slot_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Shift</label>
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.shift ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
              {errors.shift && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shift}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.start_time ? "border-red-400" : "border-gray-300 dark:border-gray-600  "
                }`}
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.end_time ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Fill Window (Min)</label>
              <input
                type="number"
                value={form.fill_window}
                onChange={(e) => setForm({ ...form, fill_window: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.fill_window ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.fill_window && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fill_window}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Grace Period (Min)</label>
              <input
                type="number"
                value={form.grace_period}
                onChange={(e) => setForm({ ...form, grace_period: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.grace_period ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.grace_period && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.grace_period}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 flex items-center"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ===============================
   MAIN PAGE (Themed)
================================*/

const InspectionSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    grace: 0,
    locked: 0,
    upcoming: 0,
  });

  const perPage = 10;

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const res = await apiService.get(endpoints.inspectionSlots.list, {
        params: { search, page, limit: perPage },
      });

      const payload = res?.data?.data ?? {};
      const rows = payload.slots ?? [];
      const pag = payload.pagination ?? null;

      setSlots(Array.isArray(rows) ? rows : []);

      if (pag?.total != null) {
        setTotalPages(Math.max(1, pag.totalPages || Math.ceil(pag.total / perPage)));
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load inspection slots");
      setSlots([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await apiService.get(endpoints.inspectionSlots.summary);
      const data = res?.data?.data;
      if (data) setSummary(data);
    } catch (e) {
      // ignore summary errors
    }
  }, []);

  useEffect(() => {
    load();
    loadSummary();
  }, [load, loadSummary]);

  // Optional: auto refresh (uncomment if you want)
  // useEffect(() => {
  //   const t = setInterval(() => {
  //     load();
  //     loadSummary();
  //   }, 30000);
  //   return () => clearInterval(t);
  // }, [load, loadSummary]);

  const deleteSlot = async (id) => {
    if (!window.confirm("Delete permanently?")) return;

    try {
      await apiService.delete(endpoints.inspectionSlots.hardDelete(id));
      toast.success("Deleted");
      load();
      loadSummary();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete slot");
    }
  };

  const statsCards = useMemo(() => {
    return [
      { title: "Total Slots", value: summary.total, color: "primary" },
      { title: "Open", value: summary.open, color: "green" },
      { title: "Grace", value: summary.grace, color: "amber" },
      { title: "Locked", value: summary.locked, color: "red" },
      { title: "Upcoming", value: summary.upcoming, color: "blue" },
    ];
  }, [summary]);

  const statusBadge = (status) => {
    const map = {
      OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      GRACE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      LOCKED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status || "UNKNOWN"}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary-600" />
              Inspection Slots
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage inspection time slots
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Slot
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statsCards.map((c) => (
            <StatCard key={c.title} title={c.title} value={c.value} color={c.color} />
          ))}
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search slots by Slot ID or Shift..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border overflow-hidden">
          {loading ? (
            <div className="py-14 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-14">
              <Settings className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No slots found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/40 border-b dark:text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase ">Slot</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Shift</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Time</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Fill/Grace</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">Runtime Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition dark:text-white">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{s.slot_id}</p>
                        <p className="text-xs text-gray-500 dark:text-white/50">ID: {s.id}</p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold">{s.shift}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {String(s.start_time).slice(0, 5)} - {String(s.end_time).slice(0, 5)}
                      </td>

                      <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                        {s.fill_window} / {s.grace_period} min
                      </td>

                      <td className="px-6 py-4 text-center">
                        {statusBadge(s.runtime_status)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelected(s);
                              setOpen(true);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => deleteSlot(s.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/40">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <SlotModal
          open={open}
          onClose={() => setOpen(false)}
          slot={selected}
          refresh={() => {
            load();
            loadSummary();
          }}
        />
      </div>
    </Layout>
  );
};

/* ===============================
   STAT CARD COMPONENT
================================*/

const StatCard = ({ title, value, color }) => {
  const colorMap = {
    primary: "bg-primary-50 dark:bg-primary-900/20 text-primary-700",
    green: "bg-green-50 dark:bg-green-900/20 text-green-700",
    red: "bg-red-50 dark:bg-red-900/20 text-red-700",
    amber: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700",
  };

  return (
    <div className={`p-5 rounded-xl shadow-sm border ${colorMap[color] || colorMap.primary}`}>
      <p className="text-xs uppercase font-semibold text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold mt-1">{value}</h2>
    </div>
  );
};

export default InspectionSlotsPage;