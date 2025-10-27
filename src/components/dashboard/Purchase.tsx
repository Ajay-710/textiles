import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Trash2, Plus, Minus, Save, RotateCcw, Printer, Percent, X } from 'lucide-react';

interface Product { id: number; name: string; price: number; qty: number; }
interface PurchaseItem { 
  id: number; name: string; mrp: number; buyRate: number; purchaseQty: number; 
  retailRate: number; discount: number; taxable: number; gst: number; 
  taxAmt: number; total: number; 
}

const Purchase = () => {
  // --- THIS IS THE CORRECTED LINE ---
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  // ------------------------------------

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [totalQty, setTotalQty] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalGst, setTotalGst] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const addProductToPurchase = () => {
    if (!selectedProduct) return alert("Please search for a product first.");
    const newItem: PurchaseItem = {
      id: selectedProduct.id, name: selectedProduct.name, mrp: selectedProduct.price,
      purchaseQty: 1, buyRate: 0, retailRate: selectedProduct.price, discount: 0,
      taxable: 0, gst: 0, taxAmt: 0, total: 0,
    };
    setPurchaseItems([...purchaseItems, newItem]);
    setSearchTerm('');
    setSelectedProduct(null);
  };
  
  const handleInputChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    (updatedItems[index] as any)[field] = value;
    setPurchaseItems(updatedItems);
  };
  
  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };
  
  useEffect(() => {
    const found = products.find(p => p.id.toString() === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
    setSelectedProduct(found || null);
  }, [searchTerm, products]);
  
  useEffect(() => {
    let qty = 0, items = 0, gst = 0, discount = 0, total = 0;
    const updatedItems = purchaseItems.map(item => {
      const taxableAmount = item.purchaseQty * item.buyRate;
      const taxAmount = taxableAmount * (item.gst / 100);
      const itemTotal = taxableAmount + taxAmount - item.discount;
      qty += Number(item.purchaseQty);
      gst += taxAmount;
      discount += Number(item.discount);
      total += itemTotal;
      return { ...item, taxable: taxableAmount, taxAmt: taxAmount, total: itemTotal };
    });

    if (JSON.stringify(updatedItems) !== JSON.stringify(purchaseItems)) {
        setPurchaseItems(updatedItems);
    }
    
    setTotalQty(qty);
    setTotalItems(purchaseItems.length);
    setTotalGst(gst);
    setTotalDiscount(discount);
    setGrandTotal(total);
  }, [JSON.stringify(purchaseItems.map(i => ({ qty: i.purchaseQty, buyRate: i.buyRate, gst: i.gst, discount: i.discount })))]);

  return (
    <div className="flex h-full gap-6 p-6 bg-gray-100">
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800 bg-yellow-300 p-2 text-center">PURCHASE</h1>
        <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-4 gap-4">
          <input type="text" placeholder="Supplier ID" className="form-input"/>
          <input type="text" placeholder="Company Name" className="form-input"/>
          <input type="text" placeholder="GST Number" className="form-input"/>
          <input type="text" placeholder="Contact No" className="form-input"/>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex-grow flex flex-col">
          <div className="overflow-y-auto border">
            <table className="w-full text-left text-sm">
              <thead className="bg-yellow-300 sticky top-0"><tr>
                {['Category', 'Particulars', 'MRP', 'Qty', 'BuyRate', 'RetailRate', 'Dis', 'Taxable', 'GST', 'TaxAmt', 'Total'].map(h => <th key={h} className="p-2 border">{h}</th>)}
              </tr></thead>
              <tbody>
                {purchaseItems.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-1 border"><input type="text" className="form-input w-full p-1" /></td>
                    <td className="p-1 border"><input type="text" value={item.name} className="form-input w-full p-1" readOnly /></td>
                    <td className="p-1 border"><input type="number" value={item.mrp} onChange={e => handleInputChange(index, 'mrp', e.target.value)} className="form-input w-full p-1"/></td>
                    <td className="p-1 border"><input type="number" value={item.purchaseQty} onChange={e => handleInputChange(index, 'purchaseQty', e.target.value)} className="form-input w-full p-1"/></td>
                    <td className="p-1 border"><input type="number" value={item.buyRate} onChange={e => handleInputChange(index, 'buyRate', e.target.value)} className="form-input w-full p-1"/></td>
                    <td className="p-1 border"><input type="number" value={item.retailRate} onChange={e => handleInputChange(index, 'retailRate', e.target.value)} className="form-input w-full p-1"/></td>
                    <td className="p-1 border"><input type="number" value={item.discount} onChange={e => handleInputChange(index, 'discount', e.target.value)} className="form-input w-full p-1"/></td>
                    <td className="p-1 border"><input type="text" value={item.taxable.toFixed(2)} className="form-input w-full p-1" readOnly /></td>
                    <td className="p-1 border"><input type="number" value={item.gst} onChange={e => handleInputChange(index, 'gst', e.target.value)} className="form-input w-full p-1"/></td>
                    <td className="p-1 border"><input type="text" value={item.taxAmt.toFixed(2)} className="form-input w-full p-1" readOnly /></td>
                    <td className="p-1 border"><input type="text" value={item.total.toFixed(2)} className="form-input w-full p-1" readOnly /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2">
            <input type="text" placeholder="Code" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input"/>
            <input type="text" placeholder="Item Name" value={selectedProduct?.name || ''} className="form-input flex-grow" readOnly/>
            <button onClick={addProductToPurchase} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md flex items-center gap-2"><Plus/> Add</button>
            <button onClick={() => removeItem(purchaseItems.length - 1)} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md flex items-center gap-2"><X/> Remove</button>
            <button className="px-4 py-2 bg-gray-200 font-semibold rounded-md flex items-center gap-2"><Printer/> Print</button>
            <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md flex items-center gap-2"><Save/> Save</button>
            <button className="px-4 py-2 bg-yellow-500 font-semibold rounded-md flex items-center gap-2"><RotateCcw/> Reset</button>
            <button className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-md flex items-center gap-2"><Percent/> IGST</button>
          </div>
        </div>
      </div>
      <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 gap-2">
          <label>Bill Date</label> <input type="text" readOnly value={new Date().toLocaleDateString()} className="form-input"/>
          <label>Bill No</label> <input type="text" className="form-input"/>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
          <button className="w-full p-3 bg-gray-100 rounded-md hover:bg-gray-200 font-semibold">ADD SUPPLIER</button>
          <button className="w-full p-3 bg-gray-100 rounded-md hover:bg-gray-200 font-semibold">REPRINT BILL</button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <div className="flex justify-between"><span>Total QTY:</span> <span className="font-bold">{totalQty}</span></div>
          <div className="flex justify-between"><span>Total Items:</span> <span className="font-bold">{totalItems}</span></div>
          <div className="flex justify-between"><span>GST:</span> <span className="font-bold text-green-600">₹{totalGst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount:</span> <span className="font-bold text-red-600">₹{totalDiscount.toFixed(2)}</span></div>
          <div className="flex justify-between text-2xl font-bold border-t pt-2 mt-2"><span>Total:</span> <span className="text-blue-600">₹{grandTotal.toFixed(2)}</span></div>
        </div>
      </aside>
    </div>
  );
};
export default Purchase;