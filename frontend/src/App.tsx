import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Layouts
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

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

// Vendor Pages
import VendorLayout from "@/components/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorKYC from "@/pages/vendor/VendorKYC";
import VendorProducts from "@/pages/vendor/VendorProducts";
import VendorAddProduct from "@/pages/vendor/VendorAddProduct";
import VendorOrders from "@/pages/vendor/VendorOrders";

// Rider Pages
import RiderLayout from "@/components/rider/RiderLayout";
import RiderDashboard from "@/pages/rider/RiderDashboard";
import RiderDeliveries from "@/pages/rider/RiderDeliveries";
import RiderEarnings from "@/pages/rider/RiderEarnings";
import RiderProfile from "@/pages/rider/RiderProfile";

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
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            {/* ═══ VENDOR ROUTES ═══ */}
            <Route path="/vendor" element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="kyc" element={<VendorKYC />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="products/new" element={<VendorAddProduct />} />
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
              <Route path="earnings" element={<RiderEarnings />} />
              <Route path="profile" element={<RiderProfile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
