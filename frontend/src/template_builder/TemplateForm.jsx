import React, { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import TemplateBuilder from "../template_builder/TemplateBuilder";
import { FileText, ChevronLeft, Save, LayoutGrid, Database, Tag } from "lucide-react";

function normalizeListResponse(res) {
  const root = res?.data?.data ?? res?.data ?? res ?? {};
  const arr = root.items || root.lines || root.stations || root.models || root.data || root;
  return Array.isArray(arr) ? arr : [];
}

function normalizeTemplateResponse(res) {
  const root = res?.data?.data ?? res?.data ?? {};
  return root.template || root;
}

export default function TemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("line");
  const [entityList, setEntityList] = useState([]);
  const [entityId, setEntityId] = useState("");
  const [schema, setSchema] = useState({ version: 1, fields: [] });

  const entityEndpoint = useMemo(() => {
    if (entityType === "line") return endpoints.lines.list;
    if (entityType === "station") return endpoints.stations.list;
    return endpoints.models.list;
  }, [entityType]);

  const loadEntities = useCallback(async (type) => {
    try {
      const url =
        type === "line" ? endpoints.lines.list :
        type === "station" ? endpoints.stations.list :
        endpoints.models.list;
      const res = await apiService.get(url);
      setEntityList(normalizeListResponse(res));
    } catch (e) {
      console.error(e);
      setEntityList([]);
      toast.error("Failed to load entities");
    }
  }, []);

  const loadTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(endpoints.templates.get(id));
      const data = normalizeTemplateResponse(res);
      setName(data.name || "");
      setEntityType(data.entity_type || "line");
      setEntityId(String(data.entity_id || ""));
      const s = typeof data.schema_json === "string"
        ? JSON.parse(data.schema_json)
        : data.schema_json || { version: 1, fields: [] };
      setSchema(s);
      await loadEntities(data.entity_type || "line");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load template");
      navigate("/templates");
    } finally {
      setLoading(false);
    }
  }, [id, loadEntities, navigate]);

  useEffect(() => {
    if (isEdit) loadTemplate();
    else loadEntities(entityType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEdit) { loadEntities(entityType); setEntityId(""); }
  }, [entityType, isEdit, loadEntities]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) return toast.error("Template name is required");
    if (!entityType) return toast.error("Entity type is required");
    if (!entityId) return toast.error("Please select an entity");
    if (!schema?.fields?.length) return toast.error("Add at least one field to the template");
    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        entity_type: entityType,
        entity_id: Number(entityId),
        schema_json: schema,
      };
      if (isEdit) {
        await apiService.put(endpoints.templates.update(id), payload);
        toast.success("Template updated successfully");
      } else {
        await apiService.post(endpoints.templates.create, payload);
        toast.success("Template created successfully");
      }
      navigate("/templates");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const entityLabel = (item) => item?.name || item?.model_name || item?.title || "#" + item?.id;

  const ENTITY_TYPES = [
    { value: "line",    label: "Line",    icon: LayoutGrid },
    { value: "station", label: "Station", icon: Database   },
    { value: "model",   label: "Model",   icon: Tag        },
  ];

  return (
    <Layout>
      <div className="max-w-full space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEdit ? "Edit Template" : "Create Template"}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEdit ? "Modify the template schema and settings" : "Configure entity settings and build the form schema"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm disabled:opacity-60 shadow transition"
            >
              <Save size={16} />
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </div>

        {/* Config Cards */}
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Template Name */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FileText size={14} className="text-primary-600 dark:text-primary-400" />
                </div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Template Name</label>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Line Quality Check"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 transition"
              />
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Give your template a descriptive name</p>
            </div>

            {/* Entity Type */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Database size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Entity Type</label>
              </div>
              {isEdit ? (
                <div className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm capitalize">
                  {entityType}
                </div>
              ) : (
                <div className="flex gap-2">
                  {ENTITY_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEntityType(value)}
                      className={"flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-semibold transition " +
                        (entityType === value
                          ? "bg-primary-600 border-primary-600 text-white shadow"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-primary-400")}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {isEdit && (
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Entity type cannot be changed after creation</p>
              )}
            </div>

            {/* Select Entity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Tag size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Select {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                </label>
              </div>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 disabled:opacity-60 transition"
              >
                <option value="">Choose {entityType}...</option>
                {entityList.map((item) => (
                  <option key={item.id} value={item.id}>{entityLabel(item)}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {entityList.length ? entityList.length + " items available" : "No items found"}
              </p>
            </div>
          </div>

          {/* Template Builder */}
          <TemplateBuilder initialSchema={schema} onChange={setSchema} />

          {/* Bottom save bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {schema?.fields?.length
                ? schema.fields.length + " field" + (schema.fields.length !== 1 ? "s" : "") + " in schema"
                : "No fields added yet"}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm disabled:opacity-60 shadow transition"
            >
              <Save size={15} />
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
