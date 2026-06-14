import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "@/pages/Homepage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Orders from "@/pages/Orders";
import Cart from "@/pages/Cart";
import ProductDetails from "@/pages/ProductDetails";
import AppLayout from "@/components/AppLayout";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import OrderTracking from "@/pages/OrderTracking";

import VerifyEmail from "@/pages/VerifyEmail";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import PrivacySecurity from "@/pages/PrivacySecurity";
import HelpSupport from "@/pages/HelpSupport";
import Terms from "@/pages/Terms";
import Alerts from "@/pages/Alerts";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileLayout from "@/components/ProfileLayout";
import VendorProfile from "@/pages/VendorProfile";
import ChangePassword from "@/pages/ChangePassword";
import TwoFactorAuth from "@/pages/TwoFactorAuth";
import ActiveSessions from "@/pages/ActiveSessions";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes — full-screen, no AppLayout */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Layout Routes — with Navbar + Footer */}
          <Route element={<AppLayout />}>
            <Route index element={<Homepage />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="orders/:id/track" element={<OrderTracking />} />
            <Route path="order-confirmation/:id" element={<OrderConfirmation />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />

            {/* Vendor Profile Route */}
            <Route path="vendor/:id" element={<VendorProfile />} />

            {/* Protected Profile Routes using ProfileLayout */}
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
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;