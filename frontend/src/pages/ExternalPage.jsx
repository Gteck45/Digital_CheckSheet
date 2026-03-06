import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { ExternalLink, ArrowLeft } from 'lucide-react';

const ExternalPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'External Page';

  useEffect(() => {
    if (!url) {
      navigate('/dashboard');
    }
  }, [url, navigate]);

  if (!url) {
    return null;
  }

  return (
    <Layout>
      <div className="p-1">
        <div className="mb-3 flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {/* <ExternalLink className="h-5 w-5" /> */}
              {title}
            </h1>
            {/* <p className="text-gray-600 dark:text-gray-400 text-xs">
              {url}
            </p> */}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <iframe
            src={url}
            className="w-full"
            style={{ height: '75vh', minHeight: '600px' }}
            title={title}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ExternalPage;