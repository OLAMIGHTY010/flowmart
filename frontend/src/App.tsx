import "./App.css";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

// A wrapper to animate page changes based on location
function AnimatedRoutes() {
  const location = useLocation();

  // Create a page transition wrapper
  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -15 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3,
  };

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public unified entry point */}
        <Route path="/" element={<PageWrapper><Welcome /></PageWrapper>} />
        <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />

        {/* Customer Flow */}
        <Route path="/vendor-profile/:id" element={<PageWrapper><VendorProfile /></PageWrapper>} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<PageWrapper><AppLayout /></PageWrapper>}>
            <Route path="/customer/home" element={<Homepage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/orders/:id/track" element={<OrderTracking />} />
          </Route>
        </Route>

        {/* Vendor Flow */}
        <Route path="/vendor">
          <Route path="dashboard" element={<PageWrapper><VendorDashboard /></PageWrapper>} />
          {/* Add more vendor routes here */}
        </Route>

        {/* Rider Flow */}
        <Route path="/rider">
          <Route path="dashboard" element={<PageWrapper><RiderDashboard /></PageWrapper>} />
          {/* Add more rider routes here */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <AnimatedRoutes />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;