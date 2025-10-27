// src/pages/dashboard/AdminDashboard.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, Pencil, Trash2 } from 'lucide-react';

// --- Placeholder Data (to be replaced with real data later) ---
const initialProducts = [
  { id: 2001, name: "Banarasi Silk Saree", price: 1899, qty: 50 },
  { id: 2002, name: "Kanchipuram Pure Silk", price: 2499, qty: 30 },
  { id: 2003, name: "Cotton Printed Saree", price: 799, qty: 100 },
  { id: 2004, name: "Georgette Party Wear Saree", price: 1299, qty: 40 },
  { id: 3001, name: "Anarkali Dress", price: 1499, qty: 25 },
  { id: 3002, name: "Straight Cut Kurti", price: 999, qty: 60 },
  { id: 3003, name: "Lehenga Choli Set", price: 2999, qty: 20 },
  { id: 3004, name: "Designer Gown", price: 1999, qty: 35 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(initialProducts);
  // Add more state for inputs as needed

  const handleLogout = () => {
    navigate('/'); // Redirect to the homepage
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Admin Panel – <span className="text-indigo-600">Manage Products & Cashiers</span>
          </h1>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </header>

        <main className="space-y-8">
          {/* --- Add New Product Section --- */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Product</h2>
            <form className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
              <div className="w-full">
                <label htmlFor="productName" className="text-sm font-medium text-gray-600">Product Name</label>
                <input id="productName" type="text" placeholder="Enter Product Name" className="form-input mt-1" />
              </div>
              <div>
                <label htmlFor="price" className="text-sm font-medium text-gray-600">Price</label>
                <input id="price" type="number" defaultValue="0" className="form-input mt-1" />
              </div>
              <div>
                <label htmlFor="quantity" className="text-sm font-medium text-gray-600">Quantity</label>
                <input id="quantity" type="number" defaultValue="0" className="form-input mt-1" />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors h-11">
                <PlusCircle size={20} /> Add Product
              </button>
            </form>
          </section>

          {/* --- Product List Section --- */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-700">Product List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">ID</th>
                    <th className="p-4 font-semibold text-gray-600">Name</th>
                    <th className="p-4 font-semibold text-gray-600">Price</th>
                    <th className="p-4 font-semibold text-gray-600">Qty</th>
                    <th className="p-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50`}>
                      <td className="p-4 text-gray-700">{product.id}</td>
                      <td className="p-4 font-medium text-gray-800">{product.name}</td>
                      <td className="p-4 text-gray-700">₹{product.price.toFixed(2)}</td>
                      <td className="p-4 text-gray-700">{product.qty}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1">
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* --- Manage Cashiers Section --- */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Manage Cashiers</h2>
              <form className="flex items-end gap-4">
                <div className="flex-grow">
                  <label htmlFor="cashierName" className="text-sm font-medium text-gray-600">Cashier Name</label>
                  <input id="cashierName" type="text" placeholder="Enter Cashier Name" className="form-input mt-1" />
                </div>
                <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors h-11">
                  <PlusCircle size={20} /> Add
                </button>
              </form>
            </section>

            {/* --- Danger Zone Section --- */}
            <section className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Danger Zone</h2>
              <p className="text-red-700 mb-4 text-sm">These actions are irreversible. Please be certain.</p>
              <button className="w-full px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                Clear All Transaction Data
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;