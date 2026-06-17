import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UserManagement from "@/pages/UserManagement";
import VendorApprovals from "@/pages/VendorApprovals";
import RiderManagement from "@/pages/RiderManagement";
import PlatformAnalytics from "@/pages/PlatformAnalytics";
import CoordinatorAnalytics from "@/pages/CoordinatorAnalytics";
import AuditLog from "@/pages/AuditLog";
import ForcePasswordChange from "@/pages/ForcePasswordChange";
import AdminLayout from "@/components/AdminLayout";
import { createProtectedRoute } from "@/routes/guards/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      gcTime: 1000 * 60 * 60 * 24 * 7,
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

const ProtectedRoute = createProtectedRoute();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Login />} />
          {/* AUTH ONLY (must be logged in) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/force-password-change" element={<ForcePasswordChange />} />
            
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/vendors" element={<VendorApprovals />} />
              <Route path="/riders" element={<RiderManagement />} />
              <Route path="/analytics" element={<PlatformAnalytics />} />
              <Route path="/coordinator-analytics" element={<CoordinatorAnalytics />} />
              <Route path="/audit-logs" element={<AuditLog />} />
              {/* Other admin routes will go here later */}
            </Route>
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;