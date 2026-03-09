import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Database, ArrowLeft } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import { showToast } from "../utils/toast";

function parseResponseJson(val) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export default function TemplateSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(
        endpoints.submissions.byTemplate(id)
      );

      const arr = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];

      setData(Array.isArray(arr) ? arr : []);
    } catch (err) {
      showToast.error("Failed to load submissions");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">
            <Database className="text-primary-600 dark:text-primary-400" />
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">
              Template Submissions
            </h1>
          </div>

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border 
              border-gray-200 dark:border-gray-700 
              bg-white dark:bg-gray-800 
              hover:bg-gray-50 dark:hover:bg-gray-700 
              text-sm font-semibold text-gray-700 dark:text-gray-200 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

        </div>

        {/* TABLE CARD */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 
          bg-white dark:bg-gray-800 shadow-sm overflow-hidden">

          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full text-sm">

                {/* TABLE HEADER */}
                <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0 z-10">
                  <tr className="text-gray-700 dark:text-gray-300">
                    <th className="px-4 py-3 text-left font-bold">ID</th>
                    <th className="px-4 py-3 text-center font-bold">Submitted By</th>
                    <th className="px-4 py-3 text-left font-bold">Response</th>
                    <th className="px-4 py-3 text-center font-bold">Date</th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>

                  {data.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                      >
                        No submissions found
                      </td>
                    </tr>
                  ) : (
                    data.map((s) => (
                      <tr
                        key={s.id}
                        className="border-t border-gray-200 dark:border-gray-700
                          hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                          {s.id}
                        </td>

                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {s.submitted_by || "-"}
                        </td>

                        <td className="px-4 py-3">

                          <div className="rounded-xl border 
                            border-gray-200 dark:border-gray-700
                            bg-gray-50 dark:bg-gray-900
                            p-3 max-h-52 overflow-auto">

                            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {JSON.stringify(
                                parseResponseJson(s.response_json),
                                null,
                                2
                              )}
                            </pre>

                          </div>

                        </td>

                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {new Date(s.created_at).toLocaleString()}
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>
              </table>

            </div>

          )}

        </div>

      </div>
    </Layout>
  );
}