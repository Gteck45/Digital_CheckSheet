import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "../components/Layout/Layout";
import { FileDown, BarChart2, RefreshCcw, Loader2, AlertCircle, Eye } from "lucide-react";
import { apiService, endpoints } from "../utils/api";

/* ---------- helpers ---------- */
const fmt = (d) => (!d ? "-" : new Date(d).toLocaleString());

/* ---------- STATUS BADGE ---------- */
const statusColors = {
  completed: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-white",
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-500 dark:text-black",
  missed:    "bg-red-100 text-red-700 dark:bg-red-600 dark:text-white animate-pulse",
  upcoming:  "bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white",
};
const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${statusColors[status] ?? "bg-gray-200 text-gray-600"}`}>
    {status ?? ""}
  </span>
);

/* ---------- KPI CARD ---------- */
const KPI = ({ title, value, color = "" }) => (
  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
    <div className={`text-2xl font-bold mt-1 ${color || "text-blue-600 dark:text-blue-400"}`}>{value}</div>
  </div>
);

/* ---------- MUI-like Select & Input ---------- */
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 text-sm transition">
    {children}
  </select>
);
const Input = ({ ...props }) => (
  <input {...props} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 text-sm transition" />
);

/* ====================== MAIN PAGE ====================== */
const ManageReportsPage = () => {
  // filter state
  const [entityType, setEntityType] = useState("");
  const [entityId,   setEntityId]   = useState("");
  const [fromDate,   setFromDate]   = useState("");
  const [toDate,     setToDate]     = useState("");
  const [search,     setSearch]     = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // entity dropdown data (from API)
  const [lines,    setLines]    = useState([]);
  const [stations, setStations] = useState([]);
  const [models,   setModels]   = useState([]);

  // report data
  const [reports,    setReports]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // modals
  const [viewRow,        setViewRow]        = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFrom,      setExportFrom]     = useState("");
  const [exportTo,        setExportTo]       = useState("");

  // Load filter dropdown data once
  useEffect(() => {
    Promise.all([
      apiService.get(endpoints.lines.list),
      apiService.get(endpoints.stations.list),
      apiService.get(endpoints.models.list),
    ]).then(([l, s, m]) => {
      setLines(l.data?.data ?? []);
      setStations(s.data?.data ?? []);
      setModels(m.data?.data ?? []);
    }).catch(() => {});
  }, []);

  // Fetch reports from backend
  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (entityType) params.entity_type = entityType;
      if (entityId)   params.entity_id   = entityId;
      if (fromDate)   params.from_date   = fromDate;
      if (toDate)     params.to_date     = toDate;
      if (search)     params.search      = search;

      const res = await apiService.get(endpoints.reports.list, params);
      setReports(res.data?.data?.reports ?? []);
      setPagination(res.data?.data?.pagination ?? { total: 0, totalPages: 1 });
    } catch (err) {
      setError("Failed to load reports: " + (err.response?.data?.message ?? err.message));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, fromDate, toDate, search]);

  useEffect(() => {
    setCurrentPage(1);
    fetchReports(1);
  }, [entityType, entityId, fromDate, toDate, search]);

  // Entity options for second dropdown
  const entityOptions = useMemo(() => {
    if (entityType === "line")    return lines;
    if (entityType === "station") return stations;
    if (entityType === "model")   return models;
    return [];
  }, [entityType, lines, stations, models]);

  const resetFilters = () => {
    setEntityType("");
    setEntityId("");
    setFromDate("");
    setToDate("");
    setSearch("");
  };

  // Export CSV
  const handleExport = () => {
    if (!exportFrom || !exportTo) {
      alert("Select From and To datetime first.");
      return;
    }
    const filtered = reports.filter(r => {
      const d = new Date(r.created_at);
      return d >= new Date(exportFrom) && d <= new Date(exportTo);
    });
    const headers = ["ID","Template","Entity","Submitted By","Date"];
    const rows = filtered.map(r => [
      r.id, r.template_name, r.entity_name, r.submitted_by ?? "", fmt(r.created_at)
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = "reports_export.csv";
    a.click();
    setShowExportModal(false);
  };

  const goToPage = (p) => {
    setCurrentPage(p);
    fetchReports(p);
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-200 transition-colors">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
              <BarChart2 className="h-7 w-7 text-primary-600" />
              Manage Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              View and export template submission reports
            </p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm"
          >
            <FileDown size={16} /> Export CSV
          </button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI title="Total Submissions" value={pagination.total} />
          <KPI title="Lines"    value={lines.filter(l => l.status === "active").length}    color="text-green-600  dark:text-green-400" />
          <KPI title="Stations" value={stations.filter(s => s.status === "active").length} color="text-yellow-600 dark:text-yellow-400" />
          <KPI title="Models"   value={models.filter(m => m.status === "active").length}   color="text-purple-600 dark:text-purple-400" />
        </div>

        {/* FILTERS */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <Input
              placeholder="Search template / user"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <Select value={entityType} onChange={e => { setEntityType(e.target.value); setEntityId(""); }}>
              <option value="">All Types</option>
              <option value="line">Line</option>
              <option value="station">Station</option>
              <option value="model">Model</option>
            </Select>

            <Select value={entityId} onChange={e => setEntityId(e.target.value)} disabled={!entityType}>
              <option value="">All {entityType || "Entities"}</option>
              {entityOptions.map(eo => (
                <option key={eo.id} value={eo.id}>{eo.name}</option>
              ))}
            </Select>

            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="From date" />
            <Input type="date" value={toDate}   onChange={e => setToDate(e.target.value)}   title="To date" />

            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition"
            >
              <RefreshCcw size={15} /> Reset
            </button>

            <button
              onClick={() => fetchReports(currentPage)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm transition"
            >
              <RefreshCcw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin" size={22} />
              <span>Loading reports</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No reports found.</p>
              <p className="text-sm mt-1">Adjust filters or submit inspection forms to generate reports.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-900 dark:text-gray-200">
                <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide">
                  <tr>
                    {["#", "Template", "Type", "Entity", "Submitted By", "Date", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{(currentPage - 1) * 15 + i + 1}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{r.template_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          r.entity_type === "line"    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"    :
                          r.entity_type === "station" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" :
                                                        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        }`}>
                          {r.entity_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.entity_name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.submitted_by ?? ""}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmt(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewRow(r)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  currentPage === i + 1
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* VIEW MODAL */}
        {viewRow && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Submission #{viewRow.id}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{viewRow.template_name}  {viewRow.entity_name}</p>
              </div>
              <div className="p-5 overflow-y-auto flex-1 space-y-2 text-sm">
                {Object.entries(viewRow.response_json ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{k}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-right">{String(v)}</span>
                  </div>
                ))}
                {Object.keys(viewRow.response_json ?? {}).length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 text-center py-4">No response data.</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setViewRow(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPORT MODAL */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-xl w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Export Report</h2>
              <label className="block text-sm mb-1 text-gray-600 dark:text-gray-400">From</label>
              <input type="datetime-local" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm" />
              <label className="block text-sm mb-1 text-gray-600 dark:text-gray-400">To</label>
              <input type="datetime-local" value={exportTo} onChange={e => setExportTo(e.target.value)}
                className="w-full mb-4 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowExportModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">Cancel</button>
                <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm transition">Export</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ManageReportsPage;
