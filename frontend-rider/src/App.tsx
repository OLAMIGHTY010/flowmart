import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyOtpPage from "@/pages/VerifyOtpPage";
import ProfileSetup from "@/pages/ProfileSetup";
import KYCInfo from "@/pages/KYCInfo";
import KYCSubmit from "@/pages/KYCSubmit";
import KYCReview from "@/pages/KYCReview";
import KYCVerification from "@/pages/KYCVerification";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import ShortageReport from "@/pages/ShortageReport";
import DeliveryDetails from "@/pages/DeliveryDetails";
import NewDelivery from "@/pages/NewDelivery";
import EmailVerified from "@/pages/EmailVerification";
import Earnings from "@/pages/Earnings";
import Profile from "@/pages/Profile";

import { createProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { OnboardingGuard } from "@/routes/guards/OnboardingGuard";
import { DashboardGuard } from "@/routes/guards/DashboardGuard";
import RiderLayout from "@/components/RiderLayout";
import { PushNotificationManager } from "@/components/PushNotificationManager";

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

const ProtectedRoute = createProtectedRoute();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PushNotificationManager>
          <Routes>

            {/* PUBLIC */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp" element={<VerifyOtpPage />} />
            <Route path="/email-verified" element={<EmailVerified />} />

            {/* ONBOARDING FLOW (profile → kyc → dashboard rules) */}
            <Route element={<OnboardingGuard />}>
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/kyc" element={<KYCInfo />} />
              <Route path="/kyc/submit" element={<KYCSubmit />} />
              <Route path="/kyc/review" element={<KYCReview />} />
              <Route path="/kyc/verification" element={<KYCVerification />} />
            </Route>

            {/* DASHBOARD FLOW (requires approved KYC) */}
            <Route element={<DashboardGuard />}>
              {/* Rider Main Layout Screens */}
              <Route element={<RiderLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/deliveries" element={<Orders />} />
                <Route path="/earnings" element={<Earnings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              {/* Overlay/Details Screens (No Bottom Nav) */}
              <Route path="/delivery/:id" element={<DeliveryDetails />} />
              <Route path="/delivery/new" element={<NewDelivery />} />
              <Route path="/delivery/:id/report" element={<ShortageReport />} />
            </Route>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PushNotificationManager>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;