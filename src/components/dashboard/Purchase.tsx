import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useReactToPrint } from 'react-to-print';
import { Plus, X, Printer, Save, RotateCcw, Percent } from 'lucide-react';
import { PurchaseOrderToPrint } from '@/components/PurchaseOrderToPrint';

// Data Structures
interface Product { id: number; name: string; price: number; qty: number; gst: number; }
interface PurchaseItem { id: number; name: string; mrp: number; buyRate: number; purchaseQty: number; retailRate: number; discount: number; taxable: number; gst: number; taxAmt: number; total: number; }
interface Supplier { id: string; name: string; gst: string; contact: string; }

const Purchase = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', [{ id: 'S-001', name: 'Silk Weavers Inc.', gst: 'GSTIN123', contact: '9876543210' }]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalQty, setTotalQty] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [billNo, setBillNo] = useState('');
  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);

  const purchaseOrderRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ /* @ts-ignore */ content: () => purchaseOrderRef.current, documentTitle: `PurchaseOrder-${billNo || 'New'}` });

  const addProductToPurchase = () => {
    if (!selectedProduct) return alert("Please search for a product first.");
    const newItem: PurchaseItem = { id: selectedProduct.id, name: selectedProduct.name, mrp: selectedProduct.price, purchaseQty: 1, buyRate: 0, retailRate: selectedProduct.price, discount: 0, taxable: 0, gst: 0, taxAmt: 0, total: 0 };
    setPurchaseItems([...purchaseItems, newItem]);
    setSearchTerm('');
    setSelectedProduct(null);
  };
  
  const handleInputChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    (updatedItems[index] as any)[field] = parseFloat(value) || 0;
    setPurchaseItems(updatedItems);
  };
  
  const removeItem = (index: number) => setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  
  useEffect(() => {
    const found = products.find(p => p.id.toString() === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
    setSelectedProduct(found || null);
  }, [searchTerm, products]);
  
  useEffect(() => {
    let qty = 0; let total = 0;
    const updatedItems = purchaseItems.map(item => {
      const itemTotal = (item.purchaseQty * item.buyRate) * (1 + item.gst / 100) - item.discount;
      qty += Number(item.purchaseQty);
      total += itemTotal;
      return { ...item, total: itemTotal };
    });
    if (JSON.stringify(updatedItems) !== JSON.stringify(purchaseItems)) {
        setPurchaseItems(updatedItems);
    }
    setTotalQty(qty);
    setGrandTotal(total);
  }, [JSON.stringify(purchaseItems.map(i => ({ qty: i.purchaseQty, buyRate: i.buyRate, gst: i.gst, discount: i.discount })))]);
  
  const handleAddSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
    const newId = `S-${(suppliers.length + 1).toString().padStart(3, '0')}`;
    setSuppliers([...suppliers, { id: newId, ...newSupplier }]);
    setSupplierModalOpen(false);
  };

  return (
    <>
      <div className="hidden">
        <PurchaseOrderToPrint ref={purchaseOrderRef} items={purchaseItems} supplierName={selectedSupplier?.name || ''} billNo={billNo} total={grandTotal} />
      </div>
      
      <div className="flex h-full gap-6 p-6 bg-gray-100">
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-800 bg-yellow-300 p-2 text-center">PURCHASE</h1>
          <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-4 gap-4">
            <input type="text" placeholder="Supplier ID" className="form-input" onChange={e => { const s = suppliers.find(sup => sup.id.toUpperCase() === e.target.value.toUpperCase()); setSelectedSupplier(s || null); }}/>
            <input type="text" placeholder="Company Name" value={selectedSupplier?.name || ''} className="form-input" readOnly/>
            <input type="text" placeholder="GST Number" value={selectedSupplier?.gst || ''} className="form-input" readOnly/>
            <input type="text" placeholder="Contact No" value={selectedSupplier?.contact || ''} className="form-input" readOnly/>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm flex-grow flex flex-col">
            <div className="overflow-y-auto border">
              <table className="w-full text-left text-sm">
                <thead className="bg-yellow-300 sticky top-0"><tr>
                  {/* --- THIS IS THE MODIFIED TEXT --- */}
                  {['Category', 'Product Name', 'MRP', 'Qty', 'BuyRate', 'RetailRate', 'Dis', 'Taxable', 'GST', 'TaxAmt', 'Total'].map(h => <th key={h} className="p-2 border">{h}</th>)}
                </tr></thead>
                <tbody>
                  {purchaseItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-1 border"><input type="text" className="form-input w-full p-1" /></td>
                      <td className="p-1 border"><input type="text" value={item.name} className="form-input w-full p-1 bg-gray-50" readOnly /></td>
                      <td className="p-1 border w-24"><input type="number" value={item.mrp} onChange={e => handleInputChange(index, 'mrp', e.target.value)} className="form-input w-full p-1"/></td>
                      <td className="p-1 border w-24"><input type="number" value={item.purchaseQty} onChange={e => handleInputChange(index, 'purchaseQty', e.target.value)} className="form-input w-full p-1"/></td>
                      <td className="p-1 border w-24"><input type="number" value={item.buyRate} onChange={e => handleInputChange(index, 'buyRate', e.target.value)} className="form-input w-full p-1"/></td>
                      <td className="p-1 border w-24"><input type="number" value={item.retailRate} onChange={e => handleInputChange(index, 'retailRate', e.target.value)} className="form-input w-full p-1"/></td>
                      <td className="p-1 border w-24"><input type="number" value={item.discount} onChange={e => handleInputChange(index, 'discount', e.target.value)} className="form-input w-full p-1"/></td>
                      <td className="p-1 border w-24"><input type="text" value={item.taxable.toFixed(2)} className="form-input w-full p-1 bg-gray-50" readOnly /></td>
                      <td className="p-1 border w-24"><input type="number" value={item.gst} onChange={e => handleInputChange(index, 'gst', e.g.value)} className="form-input w-full p-1"/></td>
                      <td className="p-1 border w-24"><input type="text" value={item.taxAmt.toFixed(2)} className="form-input w-full p-1 bg-gray-50" readOnly /></td>
                      <td className="p-1 border w-32"><input type="text" value={item.total.toFixed(2)} className="form-input w-full p-1 bg-gray-50" readOnly /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input type="text" placeholder="Enter Product Code or Name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input"/>
              <button onClick={addProductToPurchase} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md flex items-center gap-2"><Plus/> Add</button>
              <button onClick={() => removeItem(purchaseItems.length - 1)} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md flex items-center gap-2"><X/> Remove</button>
              <button onClick={handlePrint} className="px-4 py-2 bg-gray-200 font-semibold rounded-md flex items-center gap-2"><Printer/> Print</button>
              <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md flex items-center gap-2"><Save/> Save</button>
              <button className="px-4 py-2 bg-yellow-500 font-semibold rounded-md flex items-center gap-2"><RotateCcw/> Reset</button>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-md flex items-center gap-2"><Percent/> IGST</button>
            </div>
          </div>
        </div>
        <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 gap-2">
            <label>Bill Date</label> <input type="text" readOnly value={new Date().toLocaleDateString()} className="form-input"/>
            <label>Bill No</label> <input type="text" value={billNo} onChange={e => setBillNo(e.target.value)} className="form-input"/>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
            <button onClick={() => setSupplierModalOpen(true)} className="w-full p-3 bg-gray-100 rounded-md hover:bg-gray-200 font-semibold">ADD SUPPLIER</button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
            <div className="flex justify-between"><span>Total QTY:</span> <span className="font-bold">{totalQty}</span></div>
            <div className="flex justify-between text-2xl font-bold border-t pt-2 mt-2"><span>Total:</span> <span className="text-blue-600">₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </aside>
      </div>
      
      {isSupplierModalOpen && <SupplierModal onSave={handleAddSupplier} onClose={() => setSupplierModalOpen(false)} />}
    </>
  );
};

const SupplierModal = ({ onSave, onClose }: { onSave: (s: Omit<Supplier, 'id'>) => void, onClose: () => void }) => { /* ... Unchanged ... */ };

export default Purchase;