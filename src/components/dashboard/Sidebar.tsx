// src/components/dashboard/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Users, BarChart2, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const handleLogout = () => navigate('/');

  // --- THIS IS THE CORRECTED PART ---
  // "Purchase" has been removed from the navigation array.
  const navItems = [
    { name: 'Billing', path: '/admin/billing', icon: ShoppingCart },
    { name: 'Stock / Products', path: '/admin/products', icon: Package },
    { name: 'Suppliers', path: '/admin/suppliers', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];
  // ------------------------------------

  return (
    <aside className="w-64 flex-shrink-0 bg-blue-500 text-white flex flex-col p-4">
      <div className="text-2xl font-bold mb-10 px-4 pt-2">T.Gopi Textiles</div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-700 shadow-inner' : 'hover:bg-blue-600'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;