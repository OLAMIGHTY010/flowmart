import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import Login from "@/pages/Login";
import Homepage from "./pages/Homepage";
import Register from "./pages/SignUp";
// import Register from "@/pages/Register";
// import VerifyOtpPage from "@/pages/VerifyOtpPage";
// import ProfileSetup from "@/pages/ProfileSetup";
// import KYCInfo from "@/pages/KYCInfo";
// import KYCSubmit from "@/pages/KYCSubmit";
// import KYCReview from "@/pages/KYCReview";
// import KYCVerification from "@/pages/KYCVerification";
// import Dashboard from "@/pages/Dashboard";

// import { createProtectedRoute } from "@/routes/guards/ProtectedRoute";
// import { OnboardingGuard } from "@/routes/guards/OnboardingGuard";

// React Query
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

// const ProtectedRoute = createProtectedRoute();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/register" element={<Register />} />
          <Route path="/otp" element={<VerifyOtpPage />} /> */}

          {/* AUTH ONLY (must be logged in) */}
          {/* <Route element={<ProtectedRoute />}>
            <Route path="/profile-setup" element={<ProfileSetup />} />
          </Route> */}

          {/* ONBOARDING FLOW (profile → kyc → dashboard rules) */}
          {/* <Route element={<OnboardingGuard />}>
            <Route path="/kyc" element={<KYCInfo />} />
            <Route path="/kyc/submit" element={<KYCSubmit />} />
            <Route path="/kyc/review" element={<KYCReview />} />
            <Route path="/kyc/verification" element={<KYCVerification />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route> */}

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;