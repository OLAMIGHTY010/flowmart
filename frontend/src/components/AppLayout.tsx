import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./user/BottomNav";

const AppLayout = () => {
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
