import "./App.css";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Public unified pages
const Welcome = lazy(() => import("@/pages/Welcome"));
const Auth = lazy(() => import("@/pages/Auth"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));

// Customer Pages
const Homepage = lazy(() => import("@/pages/Homepage"));
import AppLayout from "@/components/AppLayout"; // Keep layout static for fast paint
const Checkout = lazy(() => import("@/pages/Checkout"));
const Orders = lazy(() => import("@/pages/Orders"));
const Messages = lazy(() => import("@/pages/Messages"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const VendorProfile = lazy(() => import("@/pages/VendorProfile"));
import ProtectedRoute from "@/components/ProtectedRoute"; // Keep guard static

// Vendor Pages
const VendorDashboard = lazy(() => import("@/pages/vendor/Dashboard"));

// Rider Pages
const RiderDashboard = lazy(() => import("@/pages/rider/Dashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      gcTime: 1000 * 60 * 60 * 24 * 7,
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <Routes>
            {/* Public unified entry point */}
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Flow */}
            <Route path="/vendor-profile/:id" element={<VendorProfile />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/customer/home" element={<Homepage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/orders/:id/track" element={<OrderTracking />} />
              </Route>
            </Route>

            {/* Vendor Flow */}
            <Route path="/vendor">
              <Route path="dashboard" element={<VendorDashboard />} />
              {/* Add more vendor routes here */}
            </Route>

            {/* Rider Flow */}
            <Route path="/rider">
              <Route path="dashboard" element={<RiderDashboard />} />
              {/* Add more rider routes here */}
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;