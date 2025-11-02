import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Trash2, Plus, Minus, Search, Printer, RotateCcw, Save, X, Pause, Play } from 'lucide-react';
import { billingService } from '@/lib/api';
import { utils, writeFile } from 'xlsx';

// --- Data Structures ---
interface Product { barcode: string; name: string; price: number; quantity: number; }
interface BillItem extends Product { qty: number; total: number; }

const Billing = () => {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [holds, setHolds] = useState<any[]>([]);

  const fetchHoldBills = async () => {
    try {
      const res = await billingService.get("/billing/hold");
      setHolds(res.data || []);
    } catch (err) {
      console.error("Failed to fetch held bills:", err);
    }
  };

  useEffect(() => {
    fetchHoldBills();
  }, []);

  const handleAddProduct = async () => {
    if (!barcode.trim()) return;
    try {
      setLoading(true);
      const res = await billingService.get(`/billing/product/${barcode}`);
      const product = res.data;
      const newItem: BillItem = { ...product, qty: 1, total: product.price };

      setItems((prev) => {
        const existing = prev.find((i) => i.barcode === barcode);
        if (existing) return prev.map((i) => i.barcode === barcode ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i);
        return [...prev, newItem];
      });
      setBarcode("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Product not found!");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (barcode: string, qty: number) => setItems((prev) => prev.map((i) => i.barcode === barcode ? { ...i, qty, total: qty * i.price } : i));
  const handleRemoveItem = (barcode: string) => setItems((prev) => prev.filter((i) => i.barcode !== barcode));

  const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

  const handleSaveBill = async () => {
    if (!items.length) return alert("Add at least one item!");
    try {
      const billData = { customerName, customerPhone, items: items.map((i) => ({ productBarcode: i.barcode, quantity: i.qty, total: i.total })), totalAmount };
      await billingService.post("/billing/create", billData);
      alert("✅ Bill created successfully!");
      handleReset();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create bill.");
    }
  };

  const handleHoldBill = async () => {
    if (!items.length) return alert("No items to hold!");
    try {
      const billData = { customerName, customerPhone, items: items.map((i) => ({ productBarcode: i.barcode, quantity: i.qty, total: i.total })), totalAmount };
      await billingService.post("/billing/puthold", billData);
      alert("🟡 Bill placed on hold!");
      handleReset();
      fetchHoldBills();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to hold bill.");
    }
  };

  const handleRetrieveHold = async (bill: any) => {
    setItems(bill.items.map((i: any) => ({ ...i, barcode: i.productBarcode, qty: i.quantity })));
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
  };

  const handleReset = () => { setItems([]); setBarcode(""); setCustomerName(""); setCustomerPhone(""); };

  const handlePrint = () => { /* ... Your print logic ... */ };

  return (
    <div className="flex h-full gap-6 p-6 bg-gray-100">
      {/* --- Main Billing Area --- */}
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
        <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Customer Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="form-input"/>
          <input type="text" placeholder="Customer Phone No. (Optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="form-input"/>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex-grow flex flex-col">
          <div className="flex gap-4 mb-4">
            <input type="text" placeholder="Enter Product Code or Name to Search" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddProduct()} className="form-input flex-grow ring-2 ring-blue-500"/>
            <button onClick={handleAddProduct} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600" disabled={loading}>{loading ? "Adding..." : "Add"}</button>
          </div>
          <div className="flex-1 overflow-y-auto border-t border-b">
            <table className="w-full text-left">
              <thead className="bg-gray-100 sticky top-0"><tr>
                <th className="p-3">Product Name</th><th className="p-3">Quantity</th><th className="p-3">Rate</th><th className="p-3">Amount</th><th className="p-3">Action</th>
              </tr></thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-10">No products added.</td></tr>}
                {items.map(item => (
                  <tr key={item.barcode} className="border-b">
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">
                      <input type="number" value={item.qty} min={1} onChange={(e) => handleQtyChange(item.barcode, Number(e.target.value))} className="form-input w-20 text-center"/>
                    </td>
                    <td className="p-2">₹{item.price.toFixed(2)}</td>
                    <td className="p-2 font-semibold">₹{item.total.toFixed(2)}</td>
                    <td className="p-2"><button onClick={() => handleRemoveItem(item.barcode)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-4">
              <button onClick={handleReset} className="px-6 py-2 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300 flex items-center gap-2"><RotateCcw size={16}/> Reset</button>
              <button onClick={handleSaveBill} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2"><Save size={16}/> Save Bill</button>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-blue-600">Total: ₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right Sidebar --- */}
      <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
          <ActionButton icon={Save} label="Finalize & Print" shortcut="F9" onClick={handleSaveBill} />
          <ActionButton icon={Pause} label="Hold Bill" shortcut="F2" onClick={handleHoldBill} />
          <ActionButton icon={Printer} label="Print Current" shortcut="F3" onClick={handlePrint} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex-grow">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">Held Bills ({holds.length})</h3>
          {holds.length > 0 ? (
            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
              {holds.map(h => (
                <li key={h.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded-md">
                  <span className="font-medium text-gray-800">{h.customerName || `Bill #${h.id}`}</span>
                  <button onClick={() => handleRetrieveHold(h)} className="flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold">
                    <Play size={14} /> Resume
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No bills on hold.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, shortcut, onClick }: any) => ( <button onClick={onClick} className="w-full flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"><div className="flex items-center gap-3"><Icon size={20} className="text-gray-600"/><span className="font-semibold text-gray-700">{label}</span></div><span className="text-xs text-gray-500 border px-1.5 py-0.5 rounded">{shortcut}</span></button>);

export default Billing;