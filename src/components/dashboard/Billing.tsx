import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Trash2, Plus, Minus, Search, Printer, RotateCcw, Save, X } from 'lucide-react';
import { BillToPrint } from '@/components/BillToPrint';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { productService, billingService } from '@/lib/api';

// Data Structures
interface Product { id: string; name: string; price: number; stockQuantity: number; gst: number; purchaseRate: number; }
interface BillItem extends Omit<Product, 'stockQuantity'> { billQty: number; discount: number; }
interface PastBill { invoiceId: string; date: string; items: (BillItem & { subtotal: number })[]; total: number; subTotal: number; discount: number; customerName: string; }
interface HeldBill { id: string; name: string; items: BillItem[]; customerName: string; }

const Billing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pastBills, setPastBills] = useState<PastBill[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isReturnModalOpen, setReturnModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true); setError(null);
      const [productsRes, pastBillsRes, heldBillsRes] = await Promise.all([
        productService.get('/products/all'),
        billingService.get('/billing/recent'),
        billingService.get('/billing/hold')
      ]);
      setProducts(productsRes.data || []);
      setPastBills(pastBillsRes.data || []);
      setHeldBills(heldBillsRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load initial data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { fetchData(); } 
      else { setIsLoading(false); setError("You are not logged in."); }
    });
    return () => unsubscribe();
  }, []);

  const billRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ /* @ts-ignore */ content: () => billRef.current });
  const triggerPrint = () => { if (billItems.length > 0) handlePrint(); };
  const clearCurrentBill = () => { setBillItems([]); setCustomerName(''); setCustomerPhone(''); };

  const addProductToBill = (product: Product) => {
    if (product.stockQuantity <= 0) return alert(`'${product.name}' is out of stock.`);
    setBillItems(currentItems => {
      const existing = currentItems.find(item => item.id === product.id);
      if (existing) {
        if (existing.billQty >= product.stockQuantity) {
          alert(`Maximum stock quantity reached for '${product.name}'.`);
          return currentItems;
        }
        return currentItems.map(item => item.id === product.id ? { ...item, billQty: item.billQty + 1 } : item);
      }
      return [...currentItems, { ...product, billQty: 1, discount: 0 }];
    });
    setSearchTerm(''); setSearchResults([]);
  };

  const updateQuantity = (id: string, newQty: number) => {
    const product = products.find(p => p.id === id);
    if (product && newQty > product.stockQuantity) { return alert(`Maximum stock is ${product.stockQuantity}.`); }
    if (newQty <= 0) { setBillItems(items => items.filter(item => item.id !== id)); } 
    else { setBillItems(items => items.map(item => item.id === id ? { ...item, billQty: newQty } : item)); }
  };

  const updateDiscount = (id: string, discount: number) => {
    setBillItems(items => items.map(item => item.id === id ? { ...item, discount } : item));
  };
  
  // --- THIS IS THE CORRECTED useMemo HOOK ---
  const { subTotal, totalDiscount, grandTotal } = useMemo(() => {
    let currentSubTotal = 0;
    let currentDiscount = 0;
    for (const item of billItems) {
      currentSubTotal += item.billQty * item.price;
      currentDiscount += item.discount;
    }
    return { 
      subTotal: currentSubTotal, 
      totalDiscount: currentDiscount, 
      grandTotal: currentSubTotal - currentDiscount 
    };
  }, [billItems]);
  // ------------------------------------------
  
  useEffect(() => {
    if (searchTerm.trim() === '') { setSearchResults([]); return; }
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm));
    setSearchResults(filtered);
  }, [searchTerm, products]);
  
  const handleFinalizeBill = async () => { /* ... Unchanged ... */ };
  const handleHoldBill = async () => { /* ... Unchanged ... */ };
  const handleResumeBill = async (billId: string) => { /* ... Unchanged ... */ };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <>
      <div className="hidden">
        <BillToPrint 
          ref={billRef} 
          items={billItems.map(item => ({ ...item, subtotal: (item.billQty * item.price) - item.discount }))} 
          total={grandTotal} subTotal={subTotal} discount={totalDiscount} 
          billNo={pastBills[0]?.invoiceId || `INV-XXXX`} customerName={customerName}
        />
      </div>
      <div className="flex h-full gap-6 p-6 bg-gray-100">
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Customer Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="form-input"/>
            <input type="text" placeholder="Customer Phone No. (Optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="form-input"/>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="form-input">
              <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option>
            </select>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm flex-grow flex flex-col">
            <div className="relative mb-4">
              <input type="text" placeholder="Enter Product Code or Name to Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-full ring-2 ring-blue-500"/>
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(p => (<li key={p.id} onClick={() => addProductToBill(p)} className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between"><span>{p.name}</span> <span className="text-gray-500">₹{p.price.toFixed(2)}</span></li>))}
                </ul>
              )}
            </div>
            <div className="flex-1 overflow-y-auto border-t border-b">
              <table className="w-full text-left">
                <thead className="bg-gray-100 sticky top-0"><tr>
                  <th className="p-3">Product Name</th><th className="p-3">Quantity</th><th className="p-3">Rate</th><th className="p-3">Discount</th><th className="p-3">Amount</th><th className="p-3">Action</th>
                </tr></thead>
                <tbody>
                  {billItems.map(item => {
                    const subtotal = (item.billQty * item.price) - item.discount;
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2"><div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.id, item.billQty - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={14}/></button><span>{item.billQty}</span><button onClick={() => updateQuantity(item.id, item.billQty + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={14}/></button></div></td>
                        <td className="p-2">₹{item.price.toFixed(2)}</td>
                        <td className="p-2"><input type="number" value={item.discount} onChange={e => updateDiscount(item.id, parseFloat(e.target.value) || 0)} className="form-input w-20 text-right"/></td>
                        <td className="p-2 font-semibold">₹{subtotal.toFixed(2)}</td>
                        <td className="p-2"><button onClick={() => updateQuantity(item.id, 0)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-4"><button onClick={clearCurrentBill} className="px-6 py-2 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300">Reset / F12</button><button onClick={handleFinalizeBill} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save / F9</button></div>
              <div className="text-right"><p className="text-4xl font-black text-blue-600">Total: ₹{grandTotal.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
        <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center"><p className="text-sm text-gray-500">Last Bill Amount</p><p className="text-2xl font-bold text-orange-500">₹{pastBills[0]?.total.toFixed(2) || '0.00'}</p></div>
          <div className="bg-white p-4 rounded-lg shadow-sm"><div className="grid grid-cols-2 gap-2 text-sm items-center"><label>Date</label> <input type="text" readOnly value={new Date().toLocaleDateString()} className="form-input"/><label>Bill No</label> <input type="text" readOnly value={pastBills[0]?.invoiceId || `INV-XXXX`} className="form-input"/></div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-3"><ActionButton icon={RotateCcw} label="Sales Return" shortcut="F5" onClick={() => setReturnModalOpen(true)} /><ActionButton icon={Printer} label="Print" shortcut="F3" onClick={triggerPrint} /><ActionButton icon={Save} label="Hold" shortcut="F2" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-2 text-lg"><div className="flex justify-between"><span>Total Qty:</span> <span className="font-bold">{billItems.reduce((sum, i) => sum + i.billQty, 0)}</span></div><div className="flex justify-between"><span>Sub Total:</span> <span className="font-bold">₹{subTotal.toFixed(2)}</span></div><div className="flex justify-between"><span>Discount:</span> <span className="font-bold">₹{totalDiscount.toFixed(2)}</span></div><div className="flex justify-between text-2xl font-bold text-blue-600 border-t pt-2 mt-2"><span>Total:</span> <span>₹{grandTotal.toFixed(2)}</span></div></div>
        </aside>
        {isReturnModalOpen && <ReturnBillModal pastBills={pastBills} onClose={() => setReturnModalOpen(false)} />}
      </div>
    </>
  );
};

const ActionButton = ({ icon: Icon, label, shortcut, onClick }: any) => { /* ... Unchanged ... */ };
const ReturnBillModal = ({ pastBills, onClose }: { pastBills: PastBill[], onClose: () => void }) => { /* ... Unchanged ... */ };

export default Billing;