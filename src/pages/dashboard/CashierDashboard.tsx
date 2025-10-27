// src/pages/dashboard/CashierDashboard.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Printer, Hand, CheckCircle } from 'lucide-react';

// --- Placeholder Data ---
const quickAddProducts = [
  "Banarasi Silk Saree (₹1899.00)", "Kanchipuram Pure Silk (₹2499.00)",
  "Cotton Printed Saree (₹799.00)", "Georgette Party Wear (₹1299.00)",
  "Anarkali Dress (₹1499.00)", "Straight Cut Kurti (₹999.00)"
];

const CashierDashboard = () => {
  const navigate = useNavigate();
  // --- State for the component (to be used later) ---
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handleLogout = () => {
    console.log("Logging out...");
    navigate('/'); // Redirect to the homepage
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 font-sans">
      
      {/* --- Main Content --- */}
      <main className="flex flex-col gap-6">
        <header className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Cashier Dashboard</h1>
        </header>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Add Products</h2>
          <div className="flex flex-wrap gap-3">
            {quickAddProducts.map((product, index) => (
              <button key={index} className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-full text-sm hover:bg-indigo-200 transition-colors">
                {product}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Customer & Product Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="text" placeholder="Customer Name (Optional)" className="form-input" />
            <input type="text" placeholder="Customer Phone (Optional)" className="form-input" />
            <select className="form-input">
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
            </select>
          </div>
          <div className="flex gap-4">
            <input type="text" placeholder="Enter or scan Product ID" className="form-input flex-grow" />
            <button className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
              Add Product
            </button>
          </div>
        </section>
        
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-grow flex flex-col">
          <div className="flex-grow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="p-3 font-semibold text-gray-600">Product</th>
                  <th className="p-3 font-semibold text-gray-600">Qty</th>
                  <th className="p-3 font-semibold text-gray-600">Price</th>
                  <th className="p-3 font-semibold text-gray-600">Discount ($)</th>
                  <th className="p-3 font-semibold text-gray-600">Subtotal</th>
                  <th className="p-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Bill items would be mapped here */}
                {billItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-10">No products added to the bill.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t-2 border-dashed border-gray-200 mt-auto pt-4 space-y-3 text-lg text-gray-700">
            <div className="flex justify-between font-semibold">
              <span>Grand Total:</span>
              <span className="text-2xl font-bold text-gray-800">₹0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <label htmlFor="cash-tendered">Cash Tendered:</label>
              <input id="cash-tendered" type="number" defaultValue="0" className="form-input w-28 text-right font-semibold" />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Change Due:</span>
              <span className="text-2xl font-bold text-green-500">₹0.00</span>
            </div>
          </div>
        </section>
      </main>

      {/* --- Sidebar --- */}
      <aside className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <button className="sidebar-btn bg-green-500 hover:bg-green-600"><CheckCircle size={20} /> Finalize Bill</button>
          <button className="sidebar-btn bg-yellow-500 hover:bg-yellow-600"><Hand size={20} /> Hold Bill</button>
          <button onClick={handleLogout} className="sidebar-btn bg-red-500 hover:bg-red-600"><LogOut size={20} /> Logout</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Past Bills (Last 5)</h3>
          <p className="text-center text-gray-500 py-4">No bills recorded yet.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Held Bills (0)</h3>
          <p className="text-center text-gray-500 py-4">No transactions on hold.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-auto">
          <button className="sidebar-btn bg-gray-200 hover:bg-gray-300 text-gray-800"><Printer size={20} /> Print Bill</button>
        </div>
      </aside>
    </div>
  );
};

// --- Reusable CSS classes can be defined in index.css if needed ---
// For this example, we'll just use Tailwind classes directly. Add these styles to src/index.css
/*
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow;
}
.sidebar-btn {
  @apply w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg hover:-translate-y-0.5 transition-transform;
}
*/

export default CashierDashboard;