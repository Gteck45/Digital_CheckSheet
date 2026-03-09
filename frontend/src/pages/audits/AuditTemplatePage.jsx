import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, Package, User, ArrowLeft } from "lucide-react";
import { apiService, endpoints } from "../../utils/api";
import toast from "react-hot-toast";

const AuditTemplatePage = () => {

  const { state } = useLocation();
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [answers, setAnswers] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ===============================
     CHECK STATE
  =============================== */

  useEffect(() => {
    if (!state) {
      toast.error("Invalid audit session");
      navigate("/audits/new");
    }
  }, []);

  /* ===============================
     GET SLOT FROM PREVIOUS PAGE
  =============================== */

  useEffect(() => {

    if (!state?.slots) return;

    const openSlot = state.slots.find(s => s.runtime_status === "OPEN");
    const graceSlot = state.slots.find(s => s.runtime_status === "GRACE");

    setActiveSlot(openSlot || graceSlot || null);

  }, [state]);

  /* ===============================
     LOAD TEMPLATE
  =============================== */

  useEffect(() => {

    const loadTemplate = async () => {

      try {

        setLoading(true);

        const res = await apiService.get(
          endpoints.templates.list,
          {
            params: {
              entity_type: state.entityType,
              entity_id: state.entityId
            }
          }
        );

        const templates = res?.data?.data?.templates || [];

        if (!templates.length) {
          toast.error("No template found");
          return;
        }

        const template = templates[0];

        setTemplateId(template.id);

        const schema =
          typeof template.schema_json === "string"
            ? JSON.parse(template.schema_json)
            : template.schema_json;

        setFields(schema?.fields || []);

      }
      catch (e) {

        console.error(e);
        toast.error("Failed to load template");

      }
      finally {
        setLoading(false);
      }

    };

    if (state?.entityType && state?.entityId) {
      loadTemplate();
    }

  }, [state?.entityType, state?.entityId]);

  /* ===============================
     ANSWER CHANGE
  =============================== */

  const handleChange = (id, value) => {

    setAnswers(prev => ({
      ...prev,
      [id]: value
    }));

  };

  /* ===============================
     SUBMIT AUDIT
  =============================== */

  const handleSubmit = async () => {

    if (!activeSlot) {
      toast.error("No active slot available");
      return;
    }

    if (!templateId) {
      toast.error("Template not loaded yet");
      return;
    }

    try {

      setSubmitting(true);

      const payload = {
        entity_type: state.entityType,
        entity_id: state.entityId,
        entity_name: state.entityName,
        template_id: templateId,
        template_name: state.reportType,
        slot_id: activeSlot.id,
        auditor_name: state.auditor,
        audit_date: state.date,
        audit_time: state.time,
        answers,
      };

      await apiService.post(endpoints.audit.save, payload);

      toast.success("Audit submitted successfully");

      navigate("/audit-list");

    }
    catch (e) {

      console.error(e);
      toast.error("Audit submission failed");

    }
    finally {
      setSubmitting(false);
    }

  };

  return (
    <Layout>

      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">

        {/* HEADER */}

        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Audit Details
            </h2>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Back
              <ArrowLeft size={16}/>
            </button>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

            <Info
              label="Entity Type"
              value={state?.entityType?.charAt(0).toUpperCase() + state?.entityType?.slice(1)}
              icon={<Package size={14}/>}
            />

            <Info
              label="Entity"
              value={state?.entityName}
              icon={<Package size={14}/>}
            />

            <Info
              label="Auditor"
              value={state?.auditor}
              icon={<User size={14}/>}
            />

            <Info
              label="Date"
              value={state?.date}
              icon={<Calendar size={14}/>}
            />

            <Info
              label="Time"
              value={state?.time}
              icon={<Clock size={14}/>}
            />

          </div>

        </div>

        {/* SLOT */}

        {activeSlot && (

          <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">

            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">
              Active Slot
            </h3>

            <div className="px-4 py-2 bg-green-500 text-white rounded-lg inline-block">

              {activeSlot.slot_id}
              {" "}
              ({activeSlot.start_time?.slice(0,5)} - {activeSlot.end_time?.slice(0,5)})

            </div>

          </div>

        )}

        {/* QUESTIONS */}

        <div className="max-w-6xl mx-auto space-y-6">

          {loading ? (
            <div className="text-center text-gray-500">Loading template...</div>
          ) : (

            fields.map(field => (

              <div
                key={field.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6"
              >

                <Question
                  question={field}
                  value={answers[field.id]}
                  onChange={handleChange}
                />

              </div>

            ))

          )}

        </div>

        {/* SUBMIT */}

        <div className="max-w-6xl mx-auto mt-6 flex justify-end">

          <button
            onClick={handleSubmit}
            disabled={!activeSlot || submitting || !templateId}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Audit"}
          </button>

        </div>

      </div>

    </Layout>
  );

};

export default AuditTemplatePage;


/* INFO COMPONENT */

const Info = ({ label, value, icon }) => (

  <div>

    <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
      {icon}
      {label}
    </div>

    <div className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-800 dark:text-white">
      {value || "-"}
    </div>

  </div>

);


/* QUESTION COMPONENT */

const Question = ({ question, value, onChange }) => {

  if (question.type === "text" || question.type === "number") {

    return (
      <div>

        <div className="text-sm mb-2 text-gray-700 dark:text-gray-200">
          {question.label}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </div>

        <input
          type={question.type}
          value={value || ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:text-white dark:bg-gray-800 dark:border-gray-700"
        />

      </div>
    );

  }

  if (question.type === "radio") {

    return (

      <div>

        <div className="text-sm mb-2 text-gray-700 dark:text-gray-200">
          {question.label}
        </div>

        <div className="flex gap-2 flex-wrap">

          {question.options?.map(opt => (

            <button
              key={opt}
              onClick={() => onChange(question.id, opt)}
              className={`px-3 py-1 rounded ${
                value === opt
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {opt}
            </button>

          ))}

        </div>

      </div>

    );

  }

  if (question.type === "checkbox") {

    return (

      <div className="flex items-center gap-2">

        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(question.id, e.target.checked)}
        />

        <span className="text-gray-700 dark:text-gray-200">
          {question.label}
        </span>

      </div>

    );

  }

  if (question.type === "date") {

    return (

      <div>

        <div className="text-sm mb-2 text-gray-700 dark:text-gray-200">
          {question.label}
        </div>

        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />

      </div>

    );

  }

  return null;

};