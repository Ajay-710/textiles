// src/App.tsx

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginModal from "./components/LoginModal";
// --- 1. IMPORT THE NEW DASHBOARD COMPONENTS ---
import CashierDashboard from './pages/dashboard/CashierDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

const queryClient = new QueryClient();

const App = () => {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index onLoginClick={openLoginModal} />} />
            
            {/* --- 2. ADD THE NEW DASHBOARD ROUTES --- */}
            <Route path="/cashier-dashboard" element={<CashierDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;