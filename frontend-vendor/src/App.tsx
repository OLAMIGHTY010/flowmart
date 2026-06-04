
import './App.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const queryClient = new QueryClient();

const App = () => {
  return(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
