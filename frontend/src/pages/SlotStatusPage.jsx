import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout/Layout";
import { Factory, Monitor, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { apiService, endpoints } from "../utils/api";

const SHIFT_LABEL = { M: "Morning", A: "Afternoon", E: "Evening", N: "Night" };

const STATUS_STYLE = {
  OPEN:     "bg-green-600 text-white",
  UPCOMING: "bg-blue-600 text-white",
  GRACE:    "bg-yellow-500 text-black",
  LOCKED:   "bg-red-600 text-white animate-pulse",
  UNKNOWN:  "bg-gray-400 text-white",
};

const SlotStatusPage = () => {
  const [lines, setLines]         = useState([]);
  const [slots, setSlots]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tvMode, setTvMode]       = useState(false);
  const [alarm, setAlarm]         = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [linesRes, slotsRes] = await Promise.all([
        apiService.get(endpoints.lines.list),
        apiService.get(endpoints.inspectionSlots.list, { limit: 100, page: 1 }),
      ]);

      const allLines  = (linesRes.data?.data ?? []).filter(l => l.status === "active");
      const allSlots  = (slotsRes.data?.data?.slots ?? []).sort((a, b) => {
        // Sort by shift order then start_time
        const shiftOrder = { M: 0, A: 1, E: 2, N: 3 };
        const sa = shiftOrder[a.shift] ?? 9;
        const sb = shiftOrder[b.shift] ?? 9;
        if (sa !== sb) return sa - sb;
        return a.start_time.localeCompare(b.start_time);
      });

      setLines(allLines);
      setSlots(allSlots);
      setLastRefresh(new Date());

      const hasAlert = allSlots.some(s => s.runtime_status === "LOCKED");
      setAlarm(hasAlert);
      if (hasAlert) {
        new Audio("/alarm.mp3").play().catch(() => {});
      }
    } catch (err) {
      setError("Failed to load production data. " + (err.message ?? ""));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 60 seconds
  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setTvMode(true);
    } else {
      document.exitFullscreen();
      setTvMode(false);
    }
  };

  const fmtTime = (t) => {
    if (!t) return "";
    const [hh, mm] = t.split(":");
    const h = Number(hh);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${mm}${ampm}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading production board...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`space-y-6 transition-all duration-300 ${tvMode ? "text-lg" : ""}`}>

        {/* ALARM BANNER */}
        {alarm && (
          <div className="flex items-center gap-3 bg-red-700 text-white px-6 py-3 rounded-xl animate-pulse shadow-lg">
            <AlertTriangle />
            <span className="font-bold tracking-wider">
              PRODUCTION ALERT: LOCKED SLOT DETECTED  ACTION REQUIRED
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Factory size={28} className="text-primary-600 dark:text-white" />
            <div className="dark:text-white">
              <h1 className="text-2xl font-bold tracking-wide">PRODUCTION SLOT BOARD</h1>
              <p className="text-sm opacity-70">
                Live Monitoring  Last refresh: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={toggleFullScreen}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition text-sm"
            >
              <Monitor size={16} /> Full Screen
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wide dark:text-white">
          <Legend color="bg-green-600"  label="Open"     />
          <Legend color="bg-blue-600"   label="Upcoming" />
          <Legend color="bg-yellow-500" label="Grace"    />
          <Legend color="bg-red-600"    label="Locked"   />
          <Legend color="bg-gray-400"   label="Unknown"  />
        </div>

        {/* Empty states */}
        {lines.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <Factory size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No active lines found.</p>
            <p className="text-sm mt-1">Add lines in the Lines Management page.</p>
          </div>
        )}

        {slots.length === 0 && lines.length > 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="font-semibold">No inspection slots configured.</p>
            <p className="text-sm mt-1">Add inspection slots in the Inspection Slots page.</p>
          </div>
        )}

        {/* GRID */}
        {lines.length > 0 && slots.length > 0 && (
          <div className="overflow-auto rounded-xl border shadow-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
            <div style={{ minWidth: `${Math.max(900, 240 + slots.length * 130)}px` }}>

              {/* Header Row */}
              <div
                className="grid bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold border-b border-gray-400 dark:border-gray-700"
                style={{ gridTemplateColumns: `240px repeat(${slots.length}, 1fr)` }}
              >
                <div className="p-4 border-r border-gray-400 dark:border-gray-700 text-sm">
                  Line / Slot 
                </div>
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 text-center border-r border-gray-400 dark:border-gray-700"
                  >
                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {SHIFT_LABEL[slot.shift] ?? slot.shift}
                    </div>
                    <div className="text-xs mt-0.5">
                      {fmtTime(slot.start_time)}  {fmtTime(slot.end_time)}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {slot.slot_id}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid border-b border-gray-300 dark:border-gray-800 dark:text-white"
                  style={{ gridTemplateColumns: `240px repeat(${slots.length}, 1fr)` }}
                >
                  <div className="p-4 font-semibold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 text-sm">
                    {line.name}
                  </div>
                  {slots.map((slot) => {
                    const st = slot.runtime_status ?? "UNKNOWN";
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-center p-3 border-r border-gray-300 dark:border-gray-800"
                      >
                        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[st] ?? STATUS_STYLE.UNKNOWN}`}>
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded ${color}`} />
    <span>{label}</span>
  </div>
);

export default SlotStatusPage;
