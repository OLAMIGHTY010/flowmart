
import './App.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import Register from "@/pages/Register";
import KYCInfo from "@/pages/KYCInfo";
import KYCReview from "@/pages/KYCReview";
import KYCSubmit from "@/pages/KYCSubmit";
import Login from './pages/Login';
import ProfileSetup from "@/pages/ProfileSetup";

const queryClient = new QueryClient();

const App = () => {
  return(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/kyc" element={<KYCInfo />} />
          <Route path="/kyc/review" element={<KYCReview />} />
          <Route path="/kyc/submit" element={<KYCSubmit />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
