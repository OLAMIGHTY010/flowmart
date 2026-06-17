// App.tsx
import { Routes, Route, Navigate } from "react-router";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import EmailVerification from "./pages/EmailVerification";
import KYC from "./pages/KYC";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewDelivery from "./pages/NewDelivery";
import DeliveryDetails from "./pages/DeliveryDetails";
import ShortageReport from "./pages/ShortageReport";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/email-verification" element={<EmailVerification />} />
      <Route path="/kyc" element={<KYC />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/new" element={<NewDelivery />} />
      <Route path="/orders/:id" element={<DeliveryDetails />} />
      <Route path="/shortage-report" element={<ShortageReport />} />
    </Routes>
  );
}

export default App;