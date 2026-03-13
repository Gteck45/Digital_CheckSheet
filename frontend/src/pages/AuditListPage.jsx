import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout/Layout";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiService, endpoints } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ================= MAIN PAGE ================= */

const AuditListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin =
    user?.roles?.includes("admin") || user?.roles?.includes("super_admin");

  const [audits, setAudits] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(true);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [activeTab, setActiveTab] = useState("my");
  const [search, setSearch] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters (draft in drawer)
  const [draftStatuses, setDraftStatuses] = useState([]);
  const [draftAuditors, setDraftAuditors] = useState([]);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  // Applied filters (actually used)
  const [applied, setApplied] = useState({
    statuses: [],
    auditors: [],
    from: "",
    to: "",
  });

  /* ================= Auto Refresh 30 Sec ================= */
useEffect(() => {
  const interval = setInterval(() => {
    if (activeTab === "upcoming") {
      fetchData();
    }
  }, 30000);

  return () => clearInterval(interval);
}, [activeTab, user, isAdmin]);

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
  try {
    if (activeTab === "upcoming") {
      setLoadingSlots(true);

      const params = {};

      if (!isAdmin) {
        params.auditor_id = user.id;
      }

      const [slotRes, auditRes] = await Promise.all([
        apiService.get(endpoints.inspectionSlots.list, { params }),
        apiService.get(endpoints.audit.list),
      ]);

      const slotData = slotRes?.data?.data?.slots || [];
      const auditData = auditRes?.data?.data?.audits || [];

      setSlots(slotData);
      setAudits(auditData);
    } else {
      setLoadingAudits(true);

      const params = {};

      if (activeTab === "my") {
        if (!isAdmin) params.auditor_id = user.id;
      }

      if (activeTab === "actions") {
        params.status = "action-required";
        if (!isAdmin) params.auditor_id = user.id;
      }

      const res = await apiService.get(endpoints.audit.list, { params });

      const data = res?.data?.data?.audits || [];

      setAudits(data);
    }
  } catch (e) {
    console.error("Failed to load data", e);
  } finally {
    setLoadingAudits(false);
    setLoadingSlots(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [activeTab, user, isAdmin]);

  const allAuditors = useMemo(
    () =>
      activeTab !== "upcoming"
        ? [...new Set(audits.map((a) => a.auditor_name).filter(Boolean))]
        : [],
    [audits, activeTab],
  );

const filteredData = useMemo(() => {
  if (activeTab === "upcoming") {

    return slots
      .map((slot) => {
const completed = audits.some(
  (a) =>
    String(a.slot_id) === String(slot.slot_id) &&
    String(a.status).toLowerCase() === "submitted"
);

        return {
          ...slot,
          completed,
          displayStatus: completed ? "COMPLETED" : slot.runtime_status,
        };

      })
      .filter((slot) => {

        const matchSearch = `${slot.slot_id} ${slot.shift}`
          .toLowerCase()
          .includes(search.toLowerCase());

        const validStatus =
          slot.runtime_status === "OPEN" ||
          slot.runtime_status === "GRACE" ||
          slot.runtime_status === "LOCKED" ||
          slot.runtime_status === "UPCOMING";

        return matchSearch && validStatus;

      });

  }

  return audits.filter((audit) => {
    const title = `${audit.entity_name} ${audit.template_name}`;

    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      String(audit.id).includes(search);

    if (!matchSearch) return false;

    if (
      applied.statuses.length > 0 &&
      !applied.statuses.includes(audit.status)
    ) {
      return false;
    }

    if (
      applied.auditors.length > 0 &&
      !applied.auditors.includes(audit.auditor_name)
    ) {
      return false;
    }

    if (applied.from && new Date(audit.audit_date) < new Date(applied.from)) {
      return false;
    }

    if (applied.to && new Date(audit.audit_date) > new Date(applied.to)) {
      return false;
    }

    return true;
  });

}, [audits, slots, search, applied, activeTab]);

  const appliedChips = useMemo(() => {
    const chips = [];
    applied.statuses.forEach((s) => chips.push({ type: "status", value: s }));
    applied.auditors.forEach((a) => chips.push({ type: "auditor", value: a }));
    if (applied.from) chips.push({ type: "from", value: applied.from });
    if (applied.to) chips.push({ type: "to", value: applied.to });
    return chips;
  }, [applied]);

  const openDrawer = () => {
    // copy applied -> draft
    setDraftStatuses(applied.statuses);
    setDraftAuditors(applied.auditors);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setDrawerOpen(true);
  };

  const applyFilters = () => {
    setApplied({
      statuses: draftStatuses,
      auditors: draftAuditors,
      from: draftFrom,
      to: draftTo,
    });
    setDrawerOpen(false);
  };

  const clearFilters = () => {
    setDraftStatuses([]);
    setDraftAuditors([]);
    setDraftFrom("");
    setDraftTo("");
  };

  const clearApplied = () => {
    setApplied({ statuses: [], auditors: [], from: "", to: "" });
  };

  const removeChip = (chip) => {
    setApplied((prev) => {
      const next = { ...prev };
      if (chip.type === "status")
        next.statuses = next.statuses.filter((x) => x !== chip.value);
      if (chip.type === "auditor")
        next.auditors = next.auditors.filter((x) => x !== chip.value);
      if (chip.type === "from") next.from = "";
      if (chip.type === "to") next.to = "";
      return next;
    });
  };

  return (
    <Layout>
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Audit Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Search, filter, start and review audits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search audits..."
                className="pl-9 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Filter */}
            <button
              onClick={openDrawer}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 text-sm"
            >
              <Filter size={16} />
              Filter
              {appliedChips.length > 0 && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-600 dark:text-white">
                  {appliedChips.length}
                </span>
              )}
            </button>

            {/* Start New */}
            <button
              onClick={() => navigate("/audits/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm"
            >
              <Plus size={16} />
              Start New Audit
            </button>
          </div>
        </div>

        {/* Applied chips */}
        {appliedChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {appliedChips.map((c) => (
              <Chip
                key={`${c.type}-${c.value}`}
                label={
                  c.type === "status"
                    ? `Status: ${humanStatus(c.value)}`
                    : c.type === "auditor"
                      ? `Auditor: ${c.value}`
                      : c.type === "from"
                        ? `From: ${c.value}`
                        : `To: ${c.value}`
                }
                onRemove={() => removeChip(c)}
              />
            ))}
            <button
              onClick={clearApplied}
              className="text-sm px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Tabs + List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex gap-6 px-6 pt-4 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
            <Tab
              label="My Audits"
              active={activeTab === "my"}
              onClick={() => setActiveTab("my")}
            />
            <Tab
              label="Upcoming"
              active={activeTab === "upcoming"}
              onClick={() => setActiveTab("upcoming")}
            />
            {/* <Tab
              label="My Actions"
              active={activeTab === "actions"}
              onClick={() => setActiveTab("actions")}
            /> */}
          </div>

          <div className="p-6 space-y-3">
            {loadingAudits || loadingSlots ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                Loading...
              </div>
            ) : filteredData.length === 0 ? (
              <EmptyState activeTab={activeTab} />
            ) : (
              filteredData.map((item) => (
                <AuditCard
  key={item.id || item.slot_id}
  item={item}
  isSlot={activeTab === "upcoming"}
  onOpen={
    activeTab === "upcoming"
      ? () => {
          if (
            item.runtime_status === "OPEN" ||
            item.runtime_status === "GRACE"
          ) {
            navigate(`/audits/new?slot=${item.slot_id}`);
          }
        }
      : () => navigate(`/audits/${item.id}`)
  }
/>
              ))
            )}
          </div>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onApply={applyFilters}
          onClear={clearFilters}
          draft={{
            statuses: draftStatuses,
            auditors: draftAuditors,
            from: draftFrom,
            to: draftTo,
          }}
          setDraft={{
            setStatuses: setDraftStatuses,
            setAuditors: setDraftAuditors,
            setFrom: setDraftFrom,
            setTo: setDraftTo,
          }}
          options={{
            auditors: allAuditors,
            statuses: ["submitted", "draft"],
          }}
        />
      </div>
    </Layout>
  );
};

export default AuditListPage;

/* ================= UI bits ================= */

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-3 transition ${
      active
        ? "text-green-600 border-b-2 border-green-600"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    }`}
  >
    {label}
  </button>
);

const Chip = ({ label, onRemove }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200">
    <span>{label}</span>
    <button onClick={onRemove} className="hover:text-red-500">
      <X size={14} />
    </button>
  </div>
);

const EmptyState = ({ activeTab }) => (
  <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
    {activeTab === "upcoming"
      ? "No upcoming inspection slots found."
      : "No audits found. Start a new audit to begin."}
  </div>
);

const AuditCard = ({ item, isSlot, onOpen }) => {
  if (isSlot) {
    const disabled =
      item.runtime_status === "LOCKED" ||
      item.runtime_status === "UPCOMING" ||
      item.completed;

    return (
      <button
        disabled={disabled}
        onClick={onOpen}
        className={`w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition flex justify-between items-center ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
            : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
        }`}
      >
        <div>
          <div className="font-medium text-gray-800 dark:text-white">
            {item.slot_id} — {item.shift}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock size={14} /> Start: {item.start_time}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> End: {item.end_time}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 capitalize">
              {item.displayStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={item.displayStatus} />
          <ChevronRight className="text-gray-400" size={18} />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition flex justify-between items-center"
    >
      <div>
        <div className="font-medium text-gray-800 dark:text-white">
          {item.entity_name} — {item.template_name}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {item.audit_date}
          </span>
          <span className="flex items-center gap-1">
            <User size={14} /> {item.auditor_name || "—"}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 capitalize">
            {item.entity_type}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={item.status} />
        <ChevronRight className="text-gray-400" size={18} />
      </div>
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    submitted: {
      label: "Submitted",
      icon: <CheckCircle2 size={14} />,
      className:
        "bg-green-100 text-green-700 dark:bg-green-600 dark:text-white",
    },

    draft: {
      label: "Draft",
      icon: <Clock size={14} />,
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500 dark:text-black",
    },

    OPEN: {
      label: "Open",
      icon: <Clock size={14} />,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white",
    },

    GRACE: {
      label: "Grace",
      icon: <AlertCircle size={14} />,
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-600 dark:text-white",
    },
    COMPLETED: {
      label: "Completed",
      icon: <CheckCircle2 size={14} />,
      className:
        "bg-green-200 text-green-800 dark:bg-green-700 dark:text-white",
    },
  };

  const s = config[status] || {
    label: status ?? "Unknown",
    icon: <AlertCircle size={14} />,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white",
  };

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${s.className}`}
    >
      {s.icon}
      {s.label}
    </div>
  );
};

const humanStatus = (s) =>
  s === "action-required"
    ? "Action Required"
    : s.charAt(0).toUpperCase() + s.slice(1);

/* ================= Filter Drawer ================= */

const FilterDrawer = ({
  open,
  onClose,
  onApply,
  onClear,
  draft,
  setDraft,
  options,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30 dark:bg-black/60"
      />

      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-[360px] bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-xl p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            Filters
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status multi-select */}
        <Section title="Status">
          <MultiSelect
            values={draft.statuses}
            setValues={setDraft.setStatuses}
            options={options.statuses.map((s) => ({
              label: humanStatus(s),
              value: s,
            }))}
          />
        </Section>

        {/* Auditor multi-select */}
        <Section title="Auditor">
          <MultiSelect
            values={draft.auditors}
            setValues={setDraft.setAuditors}
            options={options.auditors.map((a) => ({ label: a, value: a }))}
          />
        </Section>

        {/* Date Range */}
        <Section title="Date Range">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                From
              </label>
              <input
                type="date"
                value={draft.from}
                onChange={(e) => setDraft.setFrom(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                To
              </label>
              <input
                type="date"
                value={draft.to}
                onChange={(e) => setDraft.setTo(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClear}
            className="w-1/2 px-4 py-2 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            Clear
          </button>
          <button
            onClick={onApply}
            className="w-1/2 px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-5">
    <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
      {title}
    </div>
    {children}
  </div>
);

const MultiSelect = ({ options, values, setValues }) => {
  const toggle = (v) => {
    setValues(
      values.includes(v) ? values.filter((x) => x !== v) : [...values, v],
    );
  };

  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={values.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="h-4 w-4"
          />
          <span>{o.label}</span>
        </label>
      ))}

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {values.map((v) => (
            <span
              key={v}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              {options.find((o) => o.value === v)?.label ?? v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
