import { useState } from 'react'; // <-- Step 1: Import useState
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Providers - These are all correct
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Page and Component Imports
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginModal from "./components/LoginModal"; // <-- Renamed import for clarity

// You will need a Navbar or some component to trigger the login.
// For now, we will add a simple button on the homepage for testing.

const queryClient = new QueryClient();

const App = () => {
  // Step 2: Add state to manage the modal's visibility
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Helper functions to make the code cleaner
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/*
            This is where your site's header or Navbar would go.
            You would pass `openLoginModal` to a button inside it.
            For example: <Navbar onLoginClick={openLoginModal} />
          */}

          <Routes>
            {/* 
              We pass the `openLoginModal` function to the Index page.
              This allows a button on the homepage to open the modal.
            */}
            <Route path="/" element={<Index onLoginClick={openLoginModal} />} />
            
            {/* Step 3: REMOVE the /auth route */}
            {/* <Route path="/auth" element={<Auth />} />  <-- DELETE THIS LINE */}

            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Step 4: Render the modal OUTSIDE the routes and pass it the required props */}
          <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;