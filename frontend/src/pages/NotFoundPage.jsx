import React from "react";
import Layout from "../components/Layout/Layout";
import { AlertTriangle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors px-6">
        
        <div className="text-center max-w-md">
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-5 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* 404 Text */}
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white">
            404
          </h1>

          <h2 className="mt-3 text-xl font-semibold text-gray-700 dark:text-gray-200">
            Page Not Found
          </h2>

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            The page you’re looking for doesn’t exist or has been moved.
          </p>

          {/* Button */}
          <div className="mt-6">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-green-500 hover:bg-green-600 text-white transition"
            >
              <Home size={18} />
              Go Back Home
            </button>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default NotFoundPage;