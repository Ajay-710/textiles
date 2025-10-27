// src/pages/dashboard/CashierDashboard.tsx

import React, { useState, useEffect, useRef } from 'react'; // 1. Import useRef
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print'; // 2. Import the hook
import { LogOut, Printer, Hand, CheckCircle, Trash2 } from 'lucide-react';
import { BillToPrint } from '@/components/BillToPrint'; // 3. Import our new component

// --- Data Structures ---
interface Product { id: number; name: string; price: number; }
interface BillItem extends Product { qty: number; discount: number; subtotal: number; }

const quickAddProducts: Product[] = [
  { id: 2001, name: "Banarasi Silk Saree", price: 1899.00 },
  { id: 2002, name: "Kanchipuram Pure Silk", price: 2499.00 },
  { id: 2003, name: "Cotton Printed Saree", price: 799.00 },
  { id: 2004, name: "Georgette Party Wear", price: 1299.00 },
  { id: 3001, name: "Anarkali Dress", price: 1499.00 },
  { id: 3002, name: "Straight Cut Kurti", price: 999.00 },
];

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [cashTendered, setCashTendered] = useState(0);
  const [changeDue, setChangeDue] = useState(0);

  // --- 4. Setup for Printing ---
  const billRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => billRef.current,
  });
  // --- This handlePrint function now replaces the old alert() ---

  const addProductToBill = (product: Product) => {
    setBillItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
            : item
        );
      } else {
        const newItem: BillItem = { ...product, qty: 1, discount: 0, subtotal: product.price };
        return [...currentItems, newItem];
      }
    });
  };
  
  const removeItem = (productId: number) => {
    setBillItems(currentItems => currentItems.filter(item => item.id !== productId));
  };
  
  useEffect(() => {
    const total = billItems.reduce((sum, item) => sum + item.subtotal, 0);
    setGrandTotal(total);
  }, [billItems]);

  useEffect(() => {
    const change = cashTendered - grandTotal;
    setChangeDue(change > 0 ? change : 0);
  }, [cashTendered, grandTotal]);

  const handleLogout = () => navigate('/');

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 font-sans">
      
      {/* --- 5. Add the hidden component to be printed --- */}
      <div className="hidden">
        <BillToPrint 
          ref={billRef} 
          items={billItems} 
          total={grandTotal} 
          cashTendered={cashTendered} 
          changeDue={changeDue} 
        />
      </div>
      
      {/* ... The rest of your main and aside JSX remains the same ... */}
      <main className="flex flex-col gap-6">
        <header className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Cashier Dashboard</h1>
        </header>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Add Products</h2>
          <div className="flex flex-wrap gap-3">
            {quickAddProducts.map((product) => (
              <button key={product.id} onClick={() => addProductToBill(product)} className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-full text-sm hover:bg-indigo-200 transition-colors">
                {product.name} (₹{product.price.toFixed(2)})
              </button>
            ))}
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
                  <th className="p-3 font-semibold text-gray-600">Subtotal</th>
                  <th className="p-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {billItems.length > 0 ? (
                  billItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-800">{item.name}</td>
                      <td className="p-3 text-gray-600">{item.qty}</td>
                      <td className="p-3 text-gray-600">₹{item.price.toFixed(2)}</td>
                      <td className="p-3 font-semibold text-gray-800">₹{item.subtotal.toFixed(2)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-10">No products added to the bill.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t-2 border-dashed border-gray-200 mt-auto pt-4 space-y-3 text-lg text-gray-700">
            <div className="flex justify-between font-semibold">
              <span>Grand Total:</span>
              <span className="text-2xl font-bold text-gray-800">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <label htmlFor="cash-tendered">Cash Tendered:</label>
              <input id="cash-tendered" type="number" value={cashTendered} onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)} className="form-input w-32 text-right font-semibold" />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Change Due:</span>
              <span className="text-2xl font-bold text-green-500">₹{changeDue.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </main>

      <aside className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <button className="sidebar-btn bg-green-500 hover:bg-green-600"><CheckCircle size={20} /> Finalize Bill</button>
          <button className="sidebar-btn bg-yellow-500 hover:bg-yellow-600"><Hand size={20} /> Hold Bill</button>
          <button onClick={handleLogout} className="sidebar-btn bg-red-500 hover:bg-red-600"><LogOut size={20} /> Logout</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-auto">
          <button onClick={handlePrint} className="sidebar-btn bg-gray-200 hover:bg-gray-300 text-gray-800"><Printer size={20} /> Print Bill</button>
        </div>
      </aside>
    </div>
  );
};

export default CashierDashboard;