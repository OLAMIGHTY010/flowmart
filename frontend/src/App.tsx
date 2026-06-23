import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Layouts
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/routes/vendor/ProtectedRoute";
import AIChatWidget from "@/components/AIChatWidget";

// Auth Pages
import RoleSelector from "@/pages/auth/RoleSelector";
import Login from "@/pages/auth/Login";

// Shopper (User) Pages
import Homepage from "@/pages/user/Homepage";
import ProductDetails from "@/pages/user/ProductDetails";
import Cart from "@/pages/user/Cart";
import Checkout from "@/pages/user/Checkout";
import Orders from "@/pages/user/Orders";
import Profile from "@/pages/user/Profile";
import ActiveSessions from "@/pages/user/ActiveSessions";
import Alerts from "@/pages/user/Alerts";
import ChangePassword from "@/pages/user/ChangePassword";
import EditProfile from "@/pages/user/EditProfile";
import HelpSupport from "@/pages/user/HelpSupport";
import OrderConfirmation from "@/pages/user/OrderConfirmation";
import OrderTracking from "@/pages/user/OrderTracking";
import PaymentCallback from "@/pages/user/PaymentCallback";
import PrivacySecurity from "@/pages/user/PrivacySecurity";
import Terms from "@/pages/user/Terms";
import TwoFactorAuth from "@/pages/user/TwoFactorAuth";
import VendorProfile from "@/pages/user/VendorProfile";

// Vendor Pages
import VendorLayout from "@/components/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorKYC from "@/pages/vendor/VendorKYC";
import VendorProducts from "@/pages/vendor/VendorProducts";
// import VendorAddProduct from "@/pages/vendor/VendorAddProduct";
import VendorOrders from "@/pages/vendor/VendorOrders";

// Rider Pages
import RiderLayout from "@/components/rider/RiderLayout";
import RiderDashboard from "@/pages/rider/RiderDashboard";
import RiderDeliveries from "@/pages/rider/RiderDeliveries";
import RiderEarnings from "@/pages/rider/RiderEarnings";
import RiderProfile from "@/pages/rider/RiderProfile";
import RiderProfileSetup from "@/pages/rider/RiderProfileSetup";
import RiderKYCInfo from "@/pages/rider/RiderKYCInfo";
import RiderKYCSubmit from "@/pages/rider/RiderKYCSubmit";
import RiderKYCReview from "@/pages/rider/RiderKYCReview";
import RiderKYCVerification from "@/pages/rider/RiderKYCVerification";
import RiderOrders from "@/pages/rider/RiderOrders";
import RiderDeliveryDetails from "@/pages/rider/RiderDeliveryDetails";
import RiderNewDelivery from "@/pages/rider/RiderNewDelivery";
import RiderShortageReport from "@/pages/rider/RiderShortageReport";

import VendorProfileSetup from "./pages/vendor/VendorProfileSetUp";
import VendorKYCInfo from "./pages/vendor/VendorKYCInfo";
import VendorKYCSubmit from "./pages/vendor/VendorKYCSubmit";
import VendorKYCReview from "./pages/vendor/VendorKYCReview";
import VendorKYCVerification from "./pages/vendor/VendorKYCVerification";

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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AIChatWidget />
          <Routes>
            {/* ═══ PUBLIC AUTH ROUTES ═══ */}
            <Route path="/get-started" element={<RoleSelector />} />
            <Route path="/login" element={<Login />} />

            {/* ═══ SHOPPER ROUTES (with Navbar + Footer) ═══ */}
            <Route element={<AppLayout />}>
              <Route index element={<Homepage />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />

              <Route element={<ProtectedRoute />}>
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id/track" element={<OrderTracking />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                <Route path="profile/sessions" element={<ActiveSessions />} />
                <Route path="profile/alerts" element={<Alerts />} />
                <Route path="profile/password" element={<ChangePassword />} />
                <Route path="profile/security" element={<PrivacySecurity />} />
                <Route path="profile/2fa" element={<TwoFactorAuth />} />
              </Route>
              
              <Route path="checkout/success" element={<OrderConfirmation />} />
              <Route path="payment/callback" element={<PaymentCallback />} />
              <Route path="help" element={<HelpSupport />} />
              <Route path="terms" element={<Terms />} />
              <Route path="vendor/:id/profile" element={<VendorProfile />} />
            </Route>


            <Route path="/profile-setup" element={<VendorProfileSetup />} />
            <Route path="/kyc" element={<VendorKYCInfo />} />
            <Route path="/kyc/submit" element={<VendorKYCSubmit />} />
            <Route path="/kyc/review" element={<VendorKYCReview/>} />
            <Route path="/kyc/verification" element={<VendorKYCVerification />} />
            {/* ═══ VENDOR ROUTES ═══ */}
            <Route path="/vendor" element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="kyc" element={<VendorKYC />} />
              <Route path="products" element={<VendorProducts />} />
              {/* <Route path="products/new" element={<VendorAddProduct />} /> */}
              <Route path="orders" element={<VendorOrders />} />
            </Route>

            {/* ═══ RIDER ROUTES ═══ */}
            <Route path="/rider" element={
              <ProtectedRoute allowedRoles={["dispatch_rider"]}>
                <RiderLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<RiderDashboard />} />
              <Route path="deliveries" element={<RiderDeliveries />} />
              <Route path="deliveries/new" element={<RiderNewDelivery />} />
              <Route path="deliveries/:id" element={<RiderDeliveryDetails />} />
              <Route path="deliveries/:id/shortage" element={<RiderShortageReport />} />
              <Route path="orders" element={<RiderOrders />} />
              <Route path="earnings" element={<RiderEarnings />} />
              <Route path="profile" element={<RiderProfile />} />
            </Route>
            
            <Route path="/rider/profile-setup" element={<RiderProfileSetup />} />
            <Route path="/rider/kyc" element={<RiderKYCInfo />} />
            <Route path="/rider/kyc/submit" element={<RiderKYCSubmit />} />
            <Route path="/rider/kyc/review" element={<RiderKYCReview />} />
            <Route path="/rider/kyc/verification" element={<RiderKYCVerification />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
