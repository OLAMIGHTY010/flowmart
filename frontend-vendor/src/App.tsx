import './App.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuth } from '@/hooks/useAuth';
import Register from "@/pages/Register";
import KYCInfo from "@/pages/KYCInfo";
import KYCReview from "@/pages/KYCReview";
import KYCSubmit from "@/pages/KYCSubmit";
import Login from './pages/Login';
import ProfileSetup from "@/pages/ProfileSetup";
import KYCVerification from "@/pages/KYCVerification";
import Dashboard from "@/pages/Dashboard";

// Configure queryClient for offline-first caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days garbage collection time
      staleTime: 1000 * 60 * 5, // 5 minutes stale time
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  }
});

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Onboarding & Dashboard Routes */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <KYCInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc/submit"
            element={
              <ProtectedRoute>
                <KYCSubmit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc/review"
            element={
              <ProtectedRoute>
                <KYCReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc/verification"
            element={
              <ProtectedRoute>
                <KYCVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
