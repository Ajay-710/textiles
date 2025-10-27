// src/pages/dashboard/AdminLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
export default AdminLayout;