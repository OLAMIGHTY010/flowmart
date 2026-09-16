import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public unified pages
import Welcome from "@/pages/Welcome";
import Auth from "@/pages/Auth";

// Customer Pages
import Homepage from "@/pages/Homepage";
import AppLayout from "@/components/AppLayout";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Messages from "@/pages/Messages";
import OrderTracking from "@/pages/OrderTracking";

// Vendor Pages
import VendorDashboard from "@/pages/vendor/Dashboard";

// Rider Pages
import RiderDashboard from "@/pages/rider/Dashboard";

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
        <Routes>
          {/* Public unified entry point */}
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />

          {/* Customer Flow */}
          <Route path="/vendor-profile/:id" element={<VendorProfile />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/orders/:id/track" element={<OrderTracking />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;