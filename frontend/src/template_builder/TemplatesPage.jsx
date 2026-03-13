// src/pages/TemplatesPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { showToast } from "../utils/toast";
import { FileText, Plus, Search, Trash2, Edit, Database } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Works with:
  // 1) axios default => res.data = { success, data:{ templates:[] } }
  // 2) interceptor returns res.data directly => res = { success, data:{ templates:[] } }
  // 3) backend returns { templates:[] } or direct []
  const extractTemplatesArray = (res) => {
    const payload = res?.data ?? res;

    const arr =
      payload?.data?.templates ??
      payload?.templates ??
      payload?.data ??
      payload;

    return Array.isArray(arr) ? arr : [];
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(endpoints.templates.list, {
        params: { include_inactive: true },
      });
      const arr = extractTemplatesArray(res);
      setTemplates(arr);
    } catch (e) {
      console.error(e);
      showToast.error("Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templates)) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return templates;

    return templates.filter((t) => {
      const name = (t?.name || "").toLowerCase();
      const status = (t?.status || "").toLowerCase();
      const entityType = (t?.entity_type || "").toLowerCase();
      const entityId = String(t?.entity_id ?? "");
      return (
        name.includes(q) ||
        status.includes(q) ||
        entityType.includes(q) ||
        entityId.includes(q)
      );
    });
  }, [templates, searchTerm]);

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;

    try {
      // Backend route: PATCH /:id/soft-delete
      await apiService.patch(endpoints.templates.softDelete(t.id));

      showToast.success("Template deleted successfully");

      load();
    } catch (e) {
      console.error(e);
      showToast.error("Failed to delete template");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header (same as Roles UI) */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              Templates
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create and manage form templates for Line / Station / Model
            </p>
          </div>

          <button
            onClick={() => navigate("/templates/create")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-md font-medium"
          >
            <Plus className="h-5 w-5" />
            Create Template
          </button>
        </div>

        {/* Search Bar (same style) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by template name, entity type, or entity id..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-shadow"
              />
            </div>

            {searchTerm && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {filteredTemplates.length} result
                  {filteredTemplates.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Table Container (same look as Roles Table) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : "Get started by creating your first template."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/templates/create")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Template
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      {/* Template Info (role-like cell) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {t.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {t.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Entity */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-gray-500" />
                          <span className="capitalize">{t.entity_type}</span>
                          <span className="text-gray-500">#{t.entity_id}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            t.status === "inactive"
                              ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                              : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                          }`}
                        >
                          {t.status || "active"}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {t.version ?? 1}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/templates/edit/${t.id}`)}
                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => navigate(`/templates/${t.id}/submissions`)}
                            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                            title="Submissions"
                          >
                            Submissions
                          </button>

                          <button
                            onClick={() => handleDelete(t)}
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
          )}
        </div>

        {/* Summary Stats (same style as Roles summary cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Templates
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {templates.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-lg border border-green-200 dark:border-green-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <Database className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Unique Entities
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Set((templates || []).map((t) => `${t.entity_type}:${t.entity_id}`)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <Search className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Filtered Results
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {filteredTemplates.length}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}