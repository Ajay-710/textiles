// src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LoginModal from "@/components/LoginModal";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

// Import Layouts
import AdminLayout from '@/pages/dashboard/AdminLayout';
import CashierLayout from '@/pages/dashboard/CashierLayout';

// Import Dashboard Components
import Billing from '@/components/dashboard/Billing';
import Products from '@/components/dashboard/Products';
// The "Purchase" component import has been removed
import Suppliers from '@/components/dashboard/Suppliers';
import Reports from '@/components/dashboard/Reports';
import Settings from '@/components/dashboard/Settings';

const App = () => {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Index onLoginClick={openLoginModal} />} />
        
        {/* --- Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          {/* Admin Route Group */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Products />} />
            <Route path="billing" element={<Billing />} />
            <Route path="products" element={<Products />} />
            {/* The "/admin/purchase" route has been removed */}
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Cashier Route Group */}
          <Route path="/cashier" element={<CashierLayout />}>
            <Route index element={<Billing />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </BrowserRouter>
  );
};

export default App;