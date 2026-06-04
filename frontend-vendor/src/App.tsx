
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import Login from "@/pages/Login";
// import Signup from "@/pages/Signup";

const queryClient = new QueryClient();

const App = () => {
  return(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* <Route path="/vendor/signup" element={<Signup />} /> */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
