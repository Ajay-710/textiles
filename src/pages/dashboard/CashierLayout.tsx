// src/pages/dashboard/CashierLayout.tsx
import { Outlet } from 'react-router-dom';

const CashierLayout = () => {
  return (
    // This is a full-page container for the cashier view
    <div className="h-screen bg-gray-100 font-sans">
      <main className="h-full">
        <Outlet /> {/* This will render the Billing component */}
      </main>
    </div>
  );
};
export default CashierLayout;