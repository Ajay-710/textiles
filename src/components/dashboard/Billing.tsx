import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useReactToPrint } from 'react-to-print';
import { Trash2, Plus, Minus, Search, Printer, RotateCcw, Save, X } from 'lucide-react';
import { BillToPrint } from '@/components/BillToPrint';

// Data Structures
interface Product { id: number; name: string; price: number; qty: number; }
interface BillItem extends Omit<Product, 'qty'> { billQty: number; discount: number; }
interface PastBill { invoiceId: string; date: string; items: (BillItem & { subtotal: number })[]; total: number; subTotal: number; discount: number; customerName: string; }

const Billing = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', [
    { id: 1000002, name: "AJ FUNAFLUN", price: 219.00, qty: 18 },
    { id: 1000003, name: "AJ FOUR EVER", price: 349.00, qty: 8 },
  ]);
  const [pastBills, setPastBills] = useLocalStorage<PastBill[]>('pastBills', []);
  const [invoiceCounter, setInvoiceCounter] = useLocalStorage<number>('invoiceCounter', 1);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReturnModalOpen, setReturnModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // --- THIS IS THE FIX for the 'content' error ---
  const billRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    // @ts-ignore - This is the standard fix for this library's type issue.
    content: () => billRef.current,
    documentTitle: `Invoice-T.Gopi-Textiles-${invoiceCounter}`,
  });
  // -----------------------------------------------

  const clearCurrentBill = () => { setBillItems([]); setCustomerName(''); setCustomerPhone(''); };

  const addProductToBill = () => {
    if (!selectedProduct) return alert("Please search and select a product first.");
    setBillItems(currentItems => {
      const existing = currentItems.find(item => item.id === selectedProduct.id);
      if (existing) { return currentItems.map(item => item.id === selectedProduct.id ? { ...item, billQty: item.billQty + 1 } : item); }
      return [...currentItems, { ...selectedProduct, billQty: 1, discount: 0 }];
    });
    setSearchTerm(''); setSelectedProduct(null);
  };

  const updateQuantity = (id: number, newQty: number) => {
    if (newQty <= 0) { setBillItems(items => items.filter(item => item.id !== id)); } 
    else { setBillItems(items => items.map(item => item.id === id ? { ...item, billQty: newQty } : item)); }
  };

  const updateDiscount = (id: number, discount: number) => { setBillItems(items => items.map(item => item.id === id ? { ...item, discount } : item)); };
  
  const { subTotal, totalDiscount, grandTotal } = useMemo(() => {
    let currentSubTotal = 0, currentDiscount = 0;
    for (const item of billItems) {
      currentSubTotal += item.billQty * item.price;
      currentDiscount += item.discount;
    }
    return { subTotal: currentSubTotal, totalDiscount: currentDiscount, grandTotal: currentSubTotal - currentDiscount };
  }, [billItems]);
  
  useEffect(() => {
    const found = products.find(p => p.id.toString() === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
    setSelectedProduct(found || null);
  }, [searchTerm, products]);
  
  const handleFinalizeBill = () => {
    if (billItems.length === 0) return alert("Cannot finalize an empty bill.");
    const newInvoiceId = `INV-${invoiceCounter}`;
    const newPastBill: PastBill = { invoiceId: newInvoiceId, date: new Date().toLocaleString(), items: billItems.map(item => ({...item, subtotal: (item.billQty * item.price) - item.discount})), total: grandTotal, subTotal, discount: totalDiscount, customerName };
    setPastBills(current => [newPastBill, ...current.slice(0, 4)]);
    setInvoiceCounter(current => current + 1);
    handlePrint();
    clearCurrentBill();
  };

  return (
    <>
      <div className="hidden">
        <BillToPrint 
          ref={billRef} 
          items={billItems.map(item => ({ ...item, subtotal: (item.billQty * item.price) - item.discount }))} 
          total={grandTotal} 
          subTotal={subTotal} 
          discount={totalDiscount} 
          billNo={`T.G/${invoiceCounter}`} 
          customerName={customerName}
        />
      </div>
      <div className="flex h-full gap-6 p-6 bg-gray-100">
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="form-input"/>
            <input type="text" placeholder="Customer Phone No." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="form-input"/>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm flex-grow flex flex-col">
            <div className="flex gap-4 mb-4">
              <input type="text" placeholder="Enter Product Code or Name to Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input flex-grow ring-2 ring-blue-500"/>
              <button onClick={addProductToBill} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Add</button>
            </div>
            <div className="flex-1 overflow-y-auto border-t border-b">
              <table className="w-full text-left">
                <thead className="bg-gray-100 sticky top-0"><tr>
                  <th className="p-3">Code</th><th className="p-3">Particulars</th><th className="p-3">Qty</th><th className="p-3">Rate</th><th className="p-3">Dis</th><th className="p-3">Amount</th><th className="p-3">Action</th>
                </tr></thead>
                <tbody>
                  {billItems.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-10">No products added.</td></tr>}
                  {billItems.map(item => {
                    const subtotal = (item.billQty * item.price) - item.discount;
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.id}</td><td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2"><div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.id, item.billQty - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={14}/></button><span>{item.billQty}</span><button onClick={() => updateQuantity(item.id, item.billQty + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={14}/></button></div></td>
                        <td className="p-2">₹{item.price.toFixed(2)}</td>
                        <td className="p-2"><input type="number" value={item.discount} onChange={e => updateDiscount(id, parseFloat(e.target.value) || 0)} className="form-input w-20 text-right"/></td>
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
          <div className="bg-white p-4 rounded-lg shadow-sm"><div className="grid grid-cols-2 gap-2 text-sm items-center"><label>Date</label> <input type="text" readOnly value={new Date().toLocaleDateString()} className="form-input"/><label>Bill No</label> <input type="text" readOnly value={`T.G/${invoiceCounter}`} className="form-input"/></div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-3"><ActionButton icon={RotateCcw} label="Sales Return" shortcut="F5" onClick={() => setReturnModalOpen(true)} /><ActionButton icon={Printer} label="Print" shortcut="F3" onClick={handlePrint} /><ActionButton icon={Save} label="Hold" shortcut="F2" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-2 text-lg"><div className="flex justify-between"><span>Total Qty:</span> <span className="font-bold">{billItems.reduce((sum, i) => sum + i.billQty, 0)}</span></div><div className="flex justify-between"><span>Sub Total:</span> <span className="font-bold">₹{subTotal.toFixed(2)}</span></div><div className="flex justify-between"><span>Discount:</span> <span className="font-bold">₹{totalDiscount.toFixed(2)}</span></div><div className="flex justify-between text-2xl font-bold text-blue-600 border-t pt-2 mt-2"><span>Total:</span> <span>₹{grandTotal.toFixed(2)}</span></div></div>
        </aside>
        {isReturnModalOpen && <ReturnBillModal pastBills={pastBills} onClose={() => setReturnModalOpen(false)} />}
      </div>
    </>
  );
};

const ActionButton = ({ icon: Icon, label, shortcut, onClick }: any) => ( <button onClick={onClick} className="w-full flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"><div className="flex items-center gap-3"><Icon size={20} className="text-gray-600"/><span className="font-semibold text-gray-700">{label}</span></div><span className="text-xs text-gray-500 border px-1.5 py-0.5 rounded">{shortcut}</span></button>);
const ReturnBillModal = ({ pastBills, onClose }: { pastBills: PastBill[], onClose: () => void }) => {
  const [invoiceId, setInvoiceId] = useState('');
  const [foundBill, setFoundBill] = useState<PastBill | null>(null);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); const bill = pastBills.find(p => p.invoiceId.toUpperCase() === invoiceId.toUpperCase()); setFoundBill(bill || null); };
  return ( <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-gray-800">Sales Return</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div><form onSubmit={handleSearch} className="flex gap-2 mb-4"><input type="text" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="Enter Invoice ID (e.g., INV-1001)" className="form-input flex-grow" /><button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Search size={20} /></button></form>{foundBill && ( <div><p className="text-sm text-gray-500 mb-2">Billed on: {foundBill.date}</p><div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2 text-right">Total</th></tr></thead><tbody>{foundBill.items.map(item => ( <tr key={item.id} className="border-t"><td className="p-2 font-medium">{item.name}</td><td className="p-2">{item.billQty}</td><td className="p-2 text-right">₹{item.subtotal.toFixed(2)}</td></tr>))}</tbody></table></div><div className="text-right mt-4 text-xl font-bold">Total: ₹{foundBill.total.toFixed(2)}</div></div>)}</div></div> );
};

export default Billing;