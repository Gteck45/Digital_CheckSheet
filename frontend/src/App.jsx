import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext"; 

import { AuthProvider, useAuth } from "./context/AuthContext";

// Import pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import PagesPage from "./pages/PagesPage";
import IframeTestPage from "./pages/IframeTestPage";
import LoadingSpinner from "./components/LoadingSpinner";
import ExternalPage from "./pages/ExternalPage";
import LinesPage from "./pages/LinesPage";
import StationsPage from "./pages/StationsPage";
import BrandsPage from "./pages/BrandsPage";
import ModelsPage from "./pages/ModelsPage";
import InspectionSlotsPage from "./pages/InspectionSlotsPage";
import TemplateBuilder from "./template_builder/TemplateBuilder";
import TemplatesPage from "./template_builder/TemplatesPage";
import TemplateForm from "./template_builder/TemplateForm";
import TemplateSubmissions from "./template_builder/TemplateSubmissions";
import SlotStatusPage from "./pages/SlotStatusPage";
import ManageReportsPage from "./pages/ManageReportsPage";
import AuditListPage from "./pages/AuditListPage";
import NotFoundPage from "./pages/NotFoundPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <ProtectedRoute>
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pages"
                element={
                  <ProtectedRoute>
                    <PagesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/lines"
                element={
                  <ProtectedRoute>
                    <LinesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stations"
                element={
                  <ProtectedRoute>
                    <StationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/brands"
                element={
                  <ProtectedRoute>
                    <BrandsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/models"
                element={
                  <ProtectedRoute>
                    <ModelsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/inspection-slots" element={
                <ProtectedRoute>
                  <InspectionSlotsPage />
                </ProtectedRoute>
              }/>
              <Route
                path="/template_builder"
                element={
                  <ProtectedRoute>
                    <TemplateBuilder />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <TemplatesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/templates/create"
                element={
                  <ProtectedRoute>
                    <TemplateForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/templates/edit/:id"
                element={
                  <ProtectedRoute>
                    <TemplateForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/templates/:id/submissions"
                element={
                  <ProtectedRoute>
                    <TemplateSubmissions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/addons"
                element={
                  <ProtectedRoute>
                    <SlotStatusPage/>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage_report"
                element={
                  <ProtectedRoute>
                    <ManageReportsPage/>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit-list"
                element={
                  <ProtectedRoute>
                    <AuditListPage/>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/iframe-test"
                element={
                  <ProtectedRoute>
                    <IframeTestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/external"
                element={
                  <ProtectedRoute>
                    <ExternalPage />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 fallback */}
              <Route path="*" element={<NotFoundPage/>} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-color)",
                },
                className: "dark:bg-gray-800 dark:text-white",
              }}
            />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
