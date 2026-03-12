import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { apiService, endpoints } from "../../utils/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  User,
  CheckCircle2,
  FileText,
  Layers,
} from "lucide-react";

export default function AuditDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [audit, setAudit] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD AUDIT + TEMPLATE FIELDS
  =============================== */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Fetch audit record
        const auditRes = await apiService.get(endpoints.audit.get(id));
        const auditData = auditRes?.data?.data;

        if (!auditData) {
          toast.error("Audit not found");
          navigate("/audit-list");
          return;
        }

        setAudit(auditData);

        // Fetch template to get field labels
        if (auditData.template_id) {
          try {
            const tplRes = await apiService.get(
              endpoints.templates.get(auditData.template_id)
            );
            const tpl = tplRes?.data?.data;
            const schema =
              typeof tpl?.schema_json === "string"
                ? JSON.parse(tpl.schema_json)
                : tpl?.schema_json;
            setFields(schema?.fields || []);
          } catch {
            // Template might not be accessible; answers still shown by key
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load audit");
        navigate("/audit-list");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] text-gray-500 dark:text-gray-400">
          Loading audit...
        </div>
      </Layout>
    );
  }

  if (!audit) return null;

  const answers = audit.answers || {};
  const auditDate = audit.audit_date
    ? new Date(audit.audit_date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const auditTime = audit.audit_time?.slice(0, 5) || "—";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Audit #{audit.id}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Submitted on {auditDate} at {auditTime}
            </p>
          </div>
          <button
            onClick={() => navigate("/audit-list")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </div>

        {/* META CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetaCard icon={<Package size={14} />} label="Entity Type" value={capitalize(audit.entity_type)} />
          <MetaCard icon={<Layers size={14} />} label="Entity" value={audit.entity_name || "—"} />
          <MetaCard icon={<FileText size={14} />} label="Template" value={audit.template_name || "—"} />
          <MetaCard icon={<User size={14} />} label="Auditor" value={audit.auditor_name || "—"} />
          <MetaCard
            icon={<CheckCircle2 size={14} />}
            label="Status"
            value={
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                audit.status === "submitted"
                  ? "bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
              }`}>
                {capitalize(audit.status)}
              </span>
            }
          />
        </div>

        {/* DATE / TIME */}
        <div className="grid grid-cols-2 gap-3">
          <MetaCard icon={<Calendar size={14} />} label="Date" value={auditDate} />
          <MetaCard icon={<Clock size={14} />} label="Time" value={auditTime} />
        </div>

        {/* ANSWERS */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              Submitted Answers
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {Object.keys(answers).length} response{Object.keys(answers).length !== 1 ? "s" : ""}
            </p>
          </div>

          {Object.keys(answers).length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
              No answers recorded.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.entries(answers).map(([fieldId, value], index) => {
                // Try to find matching field label from template schema
                const field = fields.find(
                  (f) => f.id === fieldId || f.key === fieldId
                );
                const label = field?.label || fieldId;
                const type = field?.type || "text";

                return (
                  <AnswerRow
                    key={fieldId}
                    index={index + 1}
                    label={label}
                    value={value}
                    type={type}
                  />
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

/* ===============================
   META CARD
=============================== */

const MetaCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
      {icon}
      {label}
    </div>
    <div className="text-sm font-semibold text-gray-800 dark:text-white">
      {value || "—"}
    </div>
  </div>
);

/* ===============================
   ANSWER ROW
=============================== */

const AnswerRow = ({ index, label, value, type }) => {
  const renderValue = () => {

  if (value === null || value === undefined || value === "") {
    return <span className="italic text-gray-400 dark:text-gray-500">—</span>;
  }

  /* IMAGE */
if (type === "image") {

  let src = value;

  // File object (preview case)
  if (value instanceof File) {
    src = URL.createObjectURL(value);
  }

  // DB stored path
  else if (typeof value === "string" && value.startsWith("/uploads")) {
    src = `${import.meta.env.VITE_API_URL}${value}`;
  }

  return (
    <div className="mt-2">
      <img
        src={src}
        alt="audit"
        className="max-h-56 rounded-lg border shadow-sm"
      />
    </div>
  );
}

  /* CHECKBOX */

  if (type === "checkbox") {
    return (
      <span
        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
          value
            ? "bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-300"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  /* RADIO */

  if (type === "radio") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-600/30 dark:text-blue-300">
        {String(value)}
      </span>
    );
  }

  /* DEFAULT */

  return (
    <span className="text-gray-800 dark:text-gray-200 text-sm">
      {String(value)}
    </span>
  );
};

  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <span className="mt-0.5 w-6 h-6 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center">
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </div>
        <div className="mt-1">{renderValue()}</div>
      </div>
    </div>
  );
};

/* ===============================
   HELPERS
=============================== */

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
