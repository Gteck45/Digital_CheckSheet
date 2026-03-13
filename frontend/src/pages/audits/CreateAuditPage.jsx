import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { apiService, endpoints } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, Clock, Package, User,ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CreateAuditPage() {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [entityType, setEntityType] = useState("line");
  const [entityList, setEntityList] = useState([]);
  const [entityId, setEntityId] = useState("");

  const [reportType, setReportType] = useState("");
  const [slots, setSlots] = useState([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [loading, setLoading] = useState(false);

  const auditor = user?.name || user?.username || "Unknown";

  /* ===============================
     SYSTEM DATE TIME
  ============================== */

  const getSystemDateTime = () => {

    const now = new Date();

    return {
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5)
    };

  };

  /* ===============================
     LOAD ENTITIES
  ============================== */

  const loadEntities = async (type) => {

    try {

      const url =
        type === "line"
          ? endpoints.lines.list
          : type === "station"
          ? endpoints.stations.list
          : endpoints.models.list;

      const res = await apiService.get(url);

      const root = res?.data?.data ?? res?.data ?? {};

      const arr =
        root.items ||
        root.lines ||
        root.stations ||
        root.models ||
        root;

      setEntityList(Array.isArray(arr) ? arr : []);

    } catch (e) {

      console.error(e);
      toast.error("Failed to load entities");

    }

  };

  /* ===============================
     LOAD TEMPLATE + SLOT
  ============================== */

  const loadAuditConfig = async (type, id) => {

    if (!id) return;

    try {

      setLoading(true);

      const [templateRes, slotRes] = await Promise.all([

        apiService.get(endpoints.templates.list, {
          params: {
            entity_type: type,
            entity_id: id
          }
        }),

        apiService.get(endpoints.inspectionSlots.list)

      ]);

      /* ================= TEMPLATE ================= */

      const templates = templateRes?.data?.data?.templates || [];

      const selectedEntity =
        entityList.find(e => e.id == id)?.name ||
        entityList.find(e => e.id == id)?.model_name ||
        entityList.find(e => e.id == id)?.title ||
        "";

      const matchedTemplate = templates.find(
  t =>
    String(t.entity_type).toLowerCase() === String(type).toLowerCase() &&
    String(t.entity_id) === String(id)
);

      if (!matchedTemplate) {

        setReportType("");
        toast.error("Matching template not found");

      } else {

        setReportType(matchedTemplate.name);

      }

      /* ================= SLOT LOGIC ================= */

      const allSlots = slotRes?.data?.data?.slots || [];

      let selectedSlots = [];

      const graceSlots = allSlots.filter(
        s => s.runtime_status === "GRACE"
      );

      if (graceSlots.length > 0) {

        selectedSlots = graceSlots;

      } else {

        const openSlots = allSlots.filter(
          s => s.runtime_status === "OPEN"
        );

        selectedSlots = openSlots;

      }

      setSlots(selectedSlots);

      /* ================= DATE TIME ================= */

      const system = getSystemDateTime();

      setDate(system.date);
      setTime(system.time);

    } catch (e) {

      console.error(e);
      toast.error("Failed to load audit configuration");

    } finally {

      setLoading(false);

    }

  };

  /* ===============================
     INITIAL LOAD
  ============================== */

  useEffect(() => {

    loadEntities(entityType);

    setEntityId("");
    setReportType("");
    setSlots([]);

  }, [entityType]);

  /* ===============================
     NEXT STEP
  ============================== */

  const handleNext = () => {

    if (!entityId)
      return toast.error("Select entity first");

    if (!reportType)
      return toast.error("Template not found");

    if (!slots?.length)
      return toast.error("No active slot available");

    const entityName =
      entityList.find(e => e.id == entityId)?.name ||
      entityList.find(e => e.id == entityId)?.model_name ||
      "Unknown";

    navigate("/audits/new/template", {
      state: {
        entityType,
        entityId,
        entityName,
        reportType,
        slots,
        date,
        time,
        auditor
      }
    });

  };

  return (

    <Layout>

      <div className="space-y-6">

        {/* HEADER */}

<div className="flex items-center justify-between">

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Create New Audit
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Select entity and start inspection audit
        </p>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ArrowLeft size={16} />
        Back
      </button>

    </div>

        {/* ENTITY SELECTION */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ENTITY TYPE */}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">

            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
              Entity Type
            </label>

            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >

              <option value="line">Line</option>
              <option value="station">Station</option>
              <option value="model">Model</option>

            </select>

          </div>

          {/* ENTITY */}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">

            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
              Select {entityType}
            </label>

            <select
              value={entityId}
              onChange={(e) => {

                const val = e.target.value;

                setEntityId(val);

                loadAuditConfig(entityType, val);

              }}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >

              <option value="">Select {entityType}</option>

              {entityList.map(item => (

                <option key={item.id} value={item.id}>
                  {item.name || item.model_name || item.title}
                </option>

              ))}

            </select>

          </div>

        </div>

        {/* AUDIT INFO */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          <InfoCard icon={<Package size={14} />} label="Report Name" value={reportType} />
          <InfoCard icon={<User size={14} />} label="Auditor" value={auditor} />
          <InfoCard icon={<Calendar size={14} />} label="Date" value={date} />
          <InfoCard icon={<Clock size={14} />} label="Time" value={time} />

        </div>

        {/* ACTIVE SLOTS */}

        {slots.length > 0 && (

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">

            <div className="text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
              Active Slots
            </div>

            <div className="flex flex-wrap gap-2">

              {slots.map(s => (

                <span
                  key={s.id}
                  className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                >
                  {s.slot_id} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                </span>

              ))}

            </div>

          </div>

        )}

        {/* NEXT */}

        <div className="flex justify-end">

          <button
            disabled={!reportType || loading || slots.length === 0}
            onClick={handleNext}
            className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-extrabold disabled:opacity-60"
          >

            {loading ? "Loading..." : "Next"}

          </button>

        </div>

      </div>

    </Layout>

  );

}

/* ===============================
   INFO CARD
=============================== */

const InfoCard = ({ icon, label, value }) => (

  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">

    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
      {icon}
      {label}
    </div>

    <div className="mt-1 font-semibold text-gray-900 dark:text-white">
      {value || "-"}
    </div>

  </div>

);