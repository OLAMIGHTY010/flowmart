import { Outlet, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./user/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

const AppLayout = () => {
  const { user } = useAuth();

  // Prefetch products on mount
  useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.get<{ success: boolean; products: any[] }>("/products"),
  });

  // Restrict dispatch riders from accessing the shopper layout (user home page)
  if (user?.role === "dispatch_rider") {
    return <Navigate to="/rider/dashboard" replace />;
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: "70px" }}>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AppLayout;
