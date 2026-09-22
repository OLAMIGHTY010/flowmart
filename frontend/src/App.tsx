/**
 * ============================================================================
 * MAIN APPLICATION ROUTER & CONTEXT PROVIDER (React + Vite)
 * ============================================================================
 *
 * Configures global React Query client, Google OAuth Provider, and React Router:
 * - Public Auth: `/get-started` (Role selection), `/login`
 * - Shopper App: Marketplace, Product Details, Cart, Checkout, Profile, Tracking
 * - Vendor App: `/vendor/dashboard`, Store Inventory, Products, KYC Onboarding
 * - Rider App: `/rider/dashboard`, Active Deliveries, Earnings, Shortage Reports
 * - Admin App: `/admin/kyc/vendors`, `/admin/kyc/riders`
 *
 * @module frontend/src/App
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Layouts
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/routes/vendor/ProtectedRoute";
import AIChatWidget from "@/components/AIChatWidget";
import LogoLoader from "@/components/ui/LogoLoader";

import { lazy, Suspense } from "react";

// Auth Pages
const RoleSelector = lazy(() => import("@/pages/auth/RoleSelector"));
const Login = lazy(() => import("@/pages/auth/Login"));

// Shopper (User) Pages
const Homepage = lazy(() => import("@/pages/user/Homepage"));
const Marketplace = lazy(() => import("@/pages/user/Marketplace"));
const ProductDetails = lazy(() => import("@/pages/user/ProductDetails"));
const Cart = lazy(() => import("@/pages/user/Cart"));
const Checkout = lazy(() => import("@/pages/user/Checkout"));
const Orders = lazy(() => import("@/pages/user/Orders"));
const Profile = lazy(() => import("@/pages/user/Profile"));
const ActiveSessions = lazy(() => import("@/pages/user/ActiveSessions"));
const Alerts = lazy(() => import("@/pages/user/Alerts"));
const ChangePassword = lazy(() => import("@/pages/user/ChangePassword"));
const EditProfile = lazy(() => import("@/pages/user/EditProfile"));
const HelpSupport = lazy(() => import("@/pages/user/HelpSupport"));
const OrderConfirmation = lazy(() => import("@/pages/user/OrderConfirmation"));
const OrderTracking = lazy(() => import("@/pages/user/OrderTracking"));
const PaymentCallback = lazy(() => import("@/pages/user/PaymentCallback"));
const PrivacySecurity = lazy(() => import("@/pages/user/PrivacySecurity"));
const Terms = lazy(() => import("@/pages/user/Terms"));
const TwoFactorAuth = lazy(() => import("@/pages/user/TwoFactorAuth"));
const VendorProfile = lazy(() => import("@/pages/user/VendorProfile"));

// Vendor Pages
const VendorLayout = lazy(() => import("@/components/vendor/VendorLayout"));
const VendorDashboard = lazy(() => import("@/pages/vendor/VendorDashboard"));
const VendorKYC = lazy(() => import("@/pages/vendor/VendorKYC"));
const VendorProducts = lazy(() => import("@/pages/vendor/VendorProducts"));
const VendorProductNew = lazy(() => import("@/pages/vendor/VendorProductNew"));
const VendorOrders = lazy(() => import("@/pages/vendor/VendorOrders"));

const VendorProfileSetup = lazy(() => import("@/pages/vendor/VendorProfileSetUp"));
const VendorKYCInfo = lazy(() => import("@/pages/vendor/VendorKYCInfo"));
const VendorKYCSubmit = lazy(() => import("@/pages/vendor/VendorKYCSubmit"));
const VendorKYCReview = lazy(() => import("@/pages/vendor/VendorKYCReview"));
const VendorKYCVerification = lazy(() => import("@/pages/vendor/VendorKYCVerification"));

// Rider Pages
const RiderLayout = lazy(() => import("@/components/rider/RiderLayout"));
const RiderDashboard = lazy(() => import("@/pages/rider/RiderDashboard"));
const RiderDeliveries = lazy(() => import("@/pages/rider/RiderDeliveries"));
const RiderEarnings = lazy(() => import("@/pages/rider/RiderEarnings"));
const RiderProfile = lazy(() => import("@/pages/rider/RiderProfile"));
const RiderProfileSetup = lazy(() => import("@/pages/rider/RiderProfileSetup"));
const RiderKYCInfo = lazy(() => import("@/pages/rider/RiderKYCInfo"));
const RiderKYCSubmit = lazy(() => import("@/pages/rider/RiderKYCSubmit"));
const RiderKYCReview = lazy(() => import("@/pages/rider/RiderKYCReview"));
const RiderKYCVerification = lazy(() => import("@/pages/rider/RiderKYCVerification"));
const RiderOrders = lazy(() => import("@/pages/rider/RiderOrders"));
const RiderDeliveryDetails = lazy(() => import("@/pages/rider/RiderDeliveryDetails"));
const RiderNewDelivery = lazy(() => import("@/pages/rider/RiderNewDelivery"));
const RiderShortageReport = lazy(() => import("@/pages/rider/RiderShortageReport"));

// Admin Pages
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminVendorKYC = lazy(() => import("./pages/admin/AdminVendorKYC"));
const AdminRiderKYC = lazy(() => import("./pages/admin/AdminRiderKYC"));

const ProfileLayout = lazy(() => import("./components/user/ProfileLayout"));

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
          <Suspense fallback={<LogoLoader />}>
            <Routes>
              {/* ═══ PUBLIC AUTH ROUTES ═══ */}
              <Route path="/get-started" element={<RoleSelector />} />
            <Route path="/login" element={<Login />} />

            {/* ═══ SHOPPER ROUTES (with Navbar + Footer) ═══ */}
            <Route element={<AppLayout />}>
              <Route index element={<Homepage />} />
              <Route path="products" element={<Marketplace />} />
              <Route path="food" element={<Marketplace />} />
              <Route path="groceries" element={<Marketplace />} />
              <Route path="pharmacy" element={<Marketplace />} />
              <Route path="services" element={<Marketplace />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />

              <Route element={<ProtectedRoute />}>
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders/:id/track" element={<OrderTracking />} />
              </Route>

              <Route element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>}>
                <Route path="profile" element={<Profile />} />
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="privacy-security" element={<PrivacySecurity />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="two-factor-auth" element={<TwoFactorAuth />} />
                <Route path="active-sessions" element={<ActiveSessions />} />

                <Route path="help-support" element={<HelpSupport />} />
                <Route path="terms" element={<Terms />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wallet" element={<Profile />} />
              </Route>

              <Route path="order-confirmation/:id" element={<OrderConfirmation />} />
              <Route path="payment/callback" element={<PaymentCallback />} />
              <Route path="help" element={<HelpSupport />} />
              <Route path="terms" element={<Terms />} />
              <Route path="vendor/:id/profile" element={<VendorProfile />} />
            </Route>


            <Route path="/profile-setup" element={<VendorProfileSetup />} />
            <Route path="/kyc" element={<VendorKYCInfo />} />
            <Route path="/kyc/submit" element={<VendorKYCSubmit />} />
            <Route path="/kyc/review" element={<VendorKYCReview />} />
            <Route path="/kyc/verification" element={<VendorKYCVerification />} />
            {/* ═══ VENDOR ROUTES ═══ */}
            <Route path="/vendor" element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="kyc" element={<VendorKYC />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="products/new" element={<VendorProductNew />} />
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

            {/*  ? ? ? ADMIN ROUTES  ? ? ? */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="kyc/vendors" element={<AdminVendorKYC />} />
              <Route path="kyc/riders" element={<AdminRiderKYC />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
