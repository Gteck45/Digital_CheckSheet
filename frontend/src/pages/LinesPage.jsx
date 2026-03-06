import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  RefreshCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";

import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

/* ===============================
   MODAL
================================*/

const LineModal = ({ open, onClose, line, refresh }) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNameError("");

    if (line) {
      setName(line.name || "");
      setStatus(line.status || "active");
    } else {
      setName("");
      setStatus("active");
    }
  }, [line, open]);

  const submit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError("Line name is required");
      return;
    }

    setLoading(true);

    try {
      if (line) {
        await apiService.put(endpoints.lines.update(line.id), { name, status });
        toast.success("Line updated successfully");
      } else {
        await apiService.post(endpoints.lines.create, { name, status });
        toast.success("Line created successfully");
      }

      refresh();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save line");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {line ? "Edit Line" : "Add Line"}
          </h2>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Line Name
            </label>

            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              className={`w-full px-3 py-2.5 rounded-lg border 
                bg-white dark:bg-gray-700 
                text-gray-800 dark:text-white
                border-gray-300 dark:border-gray-600
                focus:ring-2 focus:ring-primary-500
                ${nameError ? "border-red-500" : ""}`}
              placeholder="Enter line name"
            />

            {nameError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border
                bg-white dark:bg-gray-700
                text-gray-800 dark:text-white
                border-gray-300 dark:border-gray-600
                focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border
                border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 
                text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 flex items-center"
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
   MAIN PAGE
================================*/

const LinesPage = () => {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const perPage = 10;

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const res = await apiService.get(endpoints.lines.list, {
        params: { search, page, limit: perPage },
      });

      const payload = res?.data?.data ?? res?.data ?? {};
      const rows = payload.lines ?? payload ?? [];

      setLines(Array.isArray(rows) ? rows : []);

      if (payload.pagination?.total != null) {
        setTotalPages(Math.ceil(payload.pagination.total / perPage));
      } else {
        setTotalPages(1);
      }

    } catch (err) {
      toast.error("Failed to load lines");
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (line) => {
    const newStatus = line.status === "active" ? "inactive" : "active";

    try {
      await apiService.post(endpoints.lines.status(line.id), {
        status: newStatus,
      });
      toast.success("Status updated");
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteLine = async (id) => {
    if (!window.confirm("Delete permanently?")) return;

    try {
      await apiService.delete(endpoints.lines.delete(id));
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed to delete line");
    }
  };

  const stats = useMemo(() => {
    const total = lines.length;
    const active = lines.filter((l) => l.status === "active").length;
    return { total, active, inactive: total - active };
  }, [lines]);

  const badge = (s) => {
    const active = s === "active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${active
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
              <Settings className="h-8 w-8 text-primary-600" />
              Production Lines
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage production lines
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 
              bg-gradient-to-r from-primary-600 to-primary-700 
              text-white rounded-lg shadow-md hover:shadow-lg transition"
          >
            <Plus className="h-5 w-5" />
            Add Line
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Lines" value={stats.total} />
          <StatCard title="Active" value={stats.active} />
          <StatCard title="Inactive" value={stats.inactive} />
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm 
          border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search lines..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border
                border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-800 dark:text-white
                focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg 
          border border-gray-200 dark:border-gray-700 overflow-hidden">

          {loading ? (
            <div className="py-14 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : lines.length === 0 ? (
            <div className="text-center py-14 text-gray-500 dark:text-gray-400">
              No lines found
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-gray-600 dark:text-gray-300">
                    <th className="px-6 py-3 text-left font-semibold uppercase">
                      Line
                    </th>
                    <th className="px-6 py-3 text-center font-semibold uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right font-semibold uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-gray-200 dark:border-gray-700
                        hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {l.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {l.id}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {badge(l.status)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(l)}
                            className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelected(l);
                              setOpen(true);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => deleteLine(l.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
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
                <div className="flex justify-between items-center px-6 py-4 
                  border-t border-gray-200 dark:border-gray-700 
                  bg-gray-50 dark:bg-gray-900">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>

                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-2 rounded-lg border
                        border-gray-300 dark:border-gray-600
                        bg-white dark:bg-gray-800
                        hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-lg border
                        border-gray-300 dark:border-gray-600
                        bg-white dark:bg-gray-800
                        hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <LineModal open={open} onClose={() => setOpen(false)} line={selected} refresh={load} />
      </div>
    </Layout>
  );
};

/* ===============================
   STAT CARD
================================*/

const StatCard = ({ title, value }) => (
  <div className="p-5 rounded-xl shadow-sm border 
    border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800">
    <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
      {title}
    </p>
    <h2 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
      {value}
    </h2>
  </div>
);

export default LinesPage;