import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

/* ===============================
   MODAL
================================*/

const ModelModal = ({ open, onClose, model, brands, refresh }) => {
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (model) {
      setName(model.name || "");
      setBrandId(String(model.brand_id ?? ""));
      setStatus(model.status || "active");
    } else {
      setName("");
      setBrandId("");
      setStatus("active");
    }
  }, [model, open]);

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!brandId) newErrors.brandId = "Please select a brand";
    if (!name.trim()) newErrors.name = "Model name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      if (model) {
        await apiService.put(endpoints.models.update(model.id), {
          name,
          brand_id: Number(brandId),
          status,
        });
        toast.success("Model updated successfully", {
          style: {
            background: "#1f2937",
            color: "#e5e7eb",
            border: "1px solid #374151",
          },
          iconTheme: { primary: "#3b82f6", secondary: "#1f2937" },
        });
      } else {
        await apiService.post(endpoints.models.create, {
          name,
          brand_id: Number(brandId),
          status,
        });
        toast.success("Model created successfully", {
          style: {
            background: "#1f2937",
            color: "#e5e7eb",
            border: "1px solid #374151",
          },
          iconTheme: { primary: "#3b82f6", secondary: "#1f2937" },
        });
      }

      refresh();
      onClose();
    } catch (e2) {
      console.error(e2);
      toast.error(e2?.response?.data?.message || "Failed to save model", {
        style: {
          background: "#1f2937",
          color: "#f87171",
          border: "1px solid #4b5563",
        },
        iconTheme: { primary: "#f87171", secondary: "#1f2937" },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {model ? "Edit Model" : "Add Model"}
          </h2>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand
            </label>
            <select
              value={brandId}
              onChange={(e) => { setBrandId(e.target.value); if (errors.brandId) setErrors(p => ({ ...p, brandId: "" })); }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.brandId ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="">Select Brand</option>
              {(brands || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.brandId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model Name
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
              placeholder="Enter model name"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.name ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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

const ModelsPage = () => {
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
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

      const [modelRes, brandRes] = await Promise.all([
        apiService.get(endpoints.models.list, {
          params: { search, page, limit: perPage },
        }),
        apiService.get(endpoints.brands.list),
      ]);

      const modelPayload = modelRes?.data?.data ?? modelRes?.data ?? {};
      const brandPayload = brandRes?.data?.data ?? brandRes?.data ?? [];

      const rows = modelPayload.models ?? modelPayload ?? [];
      setModels(Array.isArray(rows) ? rows : []);
      setBrands(Array.isArray(brandPayload) ? brandPayload : []);

      if (modelPayload.pagination?.total != null) {
        setTotalPages(Math.max(1, Math.ceil(modelPayload.pagination.total / perPage)));
      } else {
        setTotalPages(1);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to load models", {
        style: {
          background: "#1f2937",
          color: "#fca5a5",
          border: "1px solid #4b5563",
          borderRadius: "8px",
        },
        iconTheme: { primary: "#ef4444", secondary: "#1f2937" },
      });
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm("Delete model permanently?")) return;

    try {
      await apiService.delete(endpoints.models.delete(id));
      toast.success("Deleted", {
        style: { background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151" },
        iconTheme: { primary: "#3b82f6", secondary: "#1f2937" },
      });
      load();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to delete model", {
        style: { background: "#1f2937", color: "#f87171", border: "1px solid #4b5563" },
        iconTheme: { primary: "#f87171", secondary: "#1f2937" },
      });
    }
  };

  const badge = (s) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        s === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {String(s || "inactive").charAt(0).toUpperCase() + String(s || "inactive").slice(1)}
    </span>
  );

  const stats = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [models]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header (Roles-like) */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              Model Master
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage product models
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-md font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Model
          </button>
        </div>

        {/* Search Bar (Roles-like) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search models..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-shadow"
              />
            </div>

            {search && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {models.length} result{models.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Table Container (Roles-like) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No models found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {search ? "Try adjusting your search criteria." : "Get started by creating your first model."}
              </p>
              {!search && (
                <button
                  onClick={() => {
                    setSelected(null);
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Model
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {models.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {m.brand_name || "-"}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {m.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {m.id}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">{badge(m.status)}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelected(m);
                                setOpen(true);
                              }}
                              className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => remove(m.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition"
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
              </div>

              {/* Pagination (clean like Roles footer) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalPages}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Stats (same as Roles page) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Models
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-lg border border-green-200 dark:border-green-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Active
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Inactive
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <ModelModal
          open={open}
          onClose={() => setOpen(false)}
          model={selected}
          brands={brands}
          refresh={load}
        />
      </div>
    </Layout>
  );
};

export default ModelsPage;