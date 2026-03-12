import React, { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../utils/toast";
import TemplateBuilder from "../template_builder/TemplateBuilder";

function normalizeListResponse(res) {
  const root = res?.data?.data ?? res?.data ?? res ?? {};
  const arr =
    root.items ||
    root.lines ||
    root.stations ||
    root.models ||
    root.data ||
    root;

  return Array.isArray(arr) ? arr : [];
}

function normalizeTemplateResponse(res) {
  const root = res?.data?.data ?? res?.data ?? {};
  return root.template || root;
}

const DEFAULT_SCHEMA = { version: 1, fields: [] };

export default function TemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEdit);

  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("line");
  const [entityList, setEntityList] = useState([]);
  const [entityId, setEntityId] = useState("");
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);

  const entityEndpoint = useMemo(() => {
    switch (entityType) {
      case "line":
        return endpoints.lines.list;
      case "station":
        return endpoints.stations.list;
      case "model":
        return endpoints.models.list;
      default:
        return endpoints.lines.list;
    }
  }, [entityType]);

  const loadEntities = useCallback(async (type) => {
    try {
      const url =
        type === "line"
          ? endpoints.lines.list
          : type === "station"
          ? endpoints.stations.list
          : endpoints.models.list;

      const res = await apiService.get(url);
      const list = normalizeListResponse(res);
      setEntityList(list);
      return list;
    } catch (error) {
      console.error("loadEntities error:", error);
      setEntityList([]);
      showToast.error("Failed to load entities");
      return [];
    }
  }, []);

  const loadTemplate = useCallback(async () => {
    try {
      setLoading(true);

      const res = await apiService.get(endpoints.templates.get(id));
      const data = normalizeTemplateResponse(res);

      const nextName = data?.name || "";
      const nextEntityType = data?.entity_type || "line";
      const nextEntityId = String(data?.entity_id || "");

      let nextSchema = DEFAULT_SCHEMA;
      try {
        nextSchema =
          typeof data?.schema_json === "string"
            ? JSON.parse(data.schema_json)
            : data?.schema_json || DEFAULT_SCHEMA;
      } catch (parseError) {
        console.error("schema_json parse error:", parseError);
        nextSchema = DEFAULT_SCHEMA;
      }

      setName(nextName);
      setEntityType(nextEntityType);
      setEntityId(nextEntityId);
      setSchema(nextSchema);

      await loadEntities(nextEntityType);
    } catch (error) {
      console.error("loadTemplate error:", error);
      showToast.error("Failed to load template");
      navigate("/templates");
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, [id, loadEntities, navigate]);

  useEffect(() => {
    if (isEdit) {
      loadTemplate();
    } else {
      loadEntities(entityType).finally(() => setInitializing(false));
    }
  }, [isEdit, loadTemplate, loadEntities, entityType]);

  useEffect(() => {
    if (!isEdit) {
      setEntityId("");
      loadEntities(entityType);
    }
  }, [entityType, isEdit, loadEntities]);

  const submit = async (e) => {
    e?.preventDefault?.();

    if (loading) return;

    if (!name.trim()) {
      return showToast.error("Template name required");
    }

    if (!entityType) {
      return showToast.error("Entity type required");
    }

    if (!entityId) {
      return showToast.error("Select entity required");
    }

    if (!Array.isArray(schema?.fields) || schema.fields.length === 0) {
      return showToast.error("Add at least 1 field");
    }

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
        showToast.success("Template updated");
      } else {
        await apiService.post(endpoints.templates.create, payload);
        showToast.success("Template created");
      }

      navigate("/templates");
    } catch (error) {
      console.error("save template error:", error);
      showToast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const entityLabel = (item) => {
    return item?.name || item?.model_name || item?.title || `#${item?.id}`;
  };

  if (initializing) {
    return (
      <Layout>
        <div className="p-6 text-gray-700 dark:text-gray-200">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {isEdit ? "Edit Template" : "Create Template"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select entity → build template schema → save
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary-600 text-white font-extrabold disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
              Template Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Line Quality Check"
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              disabled={isEdit}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none disabled:opacity-60"
            >
              <option value="line">Line</option>
              <option value="station">Station</option>
              <option value="model">Model</option>
            </select>

            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEdit
                ? "Entity type cannot be changed in edit mode"
                : `API: ${entityEndpoint}`}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
              Select {entityType}
            </label>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              disabled={loading}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none disabled:opacity-60"
            >
              <option value="">Select {entityType}</option>
              {entityList.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {entityLabel(item)}
                </option>
              ))}
            </select>

            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {entityList.length ? `${entityList.length} items loaded` : "No items"}
            </div>
          </div>
        </div>

        {/* IMPORTANT: use controlled schema prop, not initialSchema */}
        <TemplateBuilder schema={schema} onChange={setSchema} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-extrabold disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </form>
    </Layout>
  );
}