import React, { useEffect, useState, useCallback, useMemo } from "react";
import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FileText, Plus, Search, Trash2, Edit, Database,
  LayoutGrid, Tag, Eye, CalendarDays, ChevronRight
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

function extractTemplatesArray(res) {
  const payload = res?.data ?? res;
  const arr = payload?.data?.templates ?? payload?.templates ?? payload?.data ?? payload;
  return Array.isArray(arr) ? arr : [];
}

const ENTITY_COLORS = {
  line:    { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-400",   icon: LayoutGrid },
  station: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: Database },
  model:   { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: Tag },
};

function EntityBadge({ type }) {
  const cfg = ENTITY_COLORS[type] ?? ENTITY_COLORS.line;
  const Icon = cfg.icon;
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize " + cfg.bg + " " + cfg.text}>
      <Icon size={11} />{type}
    </span>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(endpoints.templates.list);
      setTemplates(extractTemplatesArray(res));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templates)) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      (t?.name || "").toLowerCase().includes(q) ||
      (t?.entity_type || "").toLowerCase().includes(q) ||
      String(t?.entity_id ?? "").includes(q)
    );
  }, [templates, searchTerm]);

  const handleDelete = async (t) => {
    if (!window.confirm("Delete template \"" + t.name + "\"?")) return;
    try {
      await apiService.patch(endpoints.templates.softDelete(t.id));
      toast.success("Template deleted");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete template");
    }
  };

  const stats = useMemo(() => ({
    total: templates.length,
    uniqueEntities: new Set((templates || []).map((t) => t.entity_type + ":" + t.entity_id)).size,
    lines: templates.filter((t) => t.entity_type === "line").length,
    stations: templates.filter((t) => t.entity_type === "station").length,
    models: templates.filter((t) => t.entity_type === "model").length,
  }), [templates]);

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow">
                <FileText size={18} className="text-white" />
              </div>
              Templates
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create and manage form templates for Lines, Stations and Models
            </p>
          </div>
          <button
            onClick={() => navigate("/templates/create")}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow transition"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-primary-600", icon: FileText },
            { label: "Lines", value: stats.lines, color: "bg-blue-500", icon: LayoutGrid },
            { label: "Stations", value: stats.stations, color: "bg-emerald-500", icon: Database },
            { label: "Models", value: stats.models, color: "bg-purple-500", icon: Tag },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center gap-3">
              <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " + color}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* Search bar */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates by name, entity type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/40 transition"
              />
            </div>
            {searchTerm && (
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {filteredTemplates.length} result{filteredTemplates.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <FileText size={24} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {searchTerm ? "No templates match your search" : "No templates yet"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {searchTerm ? "Try a different search term" : "Create your first template to get started"}
                </p>
              </div>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/templates/create")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow transition"
                >
                  <Plus size={15} />
                  Create Template
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Template</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Fields</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Version</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTemplates.map((t) => {
                    const schema = typeof t.schema_json === "string"
                      ? (() => { try { return JSON.parse(t.schema_json); } catch { return null; } })()
                      : t.schema_json;
                    const fieldCount = schema?.fields?.length ?? 0;

                    return (
                      <tr
                        key={t.id}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-100"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText size={16} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">ID #{t.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <EntityBadge type={t.entity_type} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">#{t.entity_id}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            v{t.version ?? 1}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate("/templates/edit/" + t.id)}
                              title="Edit"
                              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => navigate("/templates/" + t.id + "/submissions")}
                              title="View Submissions"
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              title="Delete"
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
