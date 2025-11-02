import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Trash2, Plus, Minus } from 'lucide-react';
import { BillToPrint } from '@/components/BillToPrint';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { productService, billingService } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  gst: number;
  purchaseRate: number;
}

interface BillItem extends Omit<Product, 'stockQuantity'> {
  billQty: number;
  discount: number;
}

interface PastBill {
  invoiceId: string;
  date: string;
  items: (BillItem & { subtotal: number })[];
  total: number;
  subTotal: number;
  discount: number;
  customerName: string;
}

interface HeldBill {
  id: string;
  name: string;
  items: BillItem[];
  customerName: string;
}

const Billing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pastBills, setPastBills] = useState<PastBill[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const billRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => billRef.current,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, b] = await Promise.allSettled([
        productService.get('/products/all'),
        billingService.get('/billing/all'),
      ]);
      setProducts(p.status === 'fulfilled' ? p.value.data || [] : []);
      setPastBills(b.status === 'fulfilled' ? b.value.data || [] : []);
    } catch {
      setError('Unable to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) fetchData();
      else {
        setError('You are not logged in.');
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const clearBill = () => {
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  const addProduct = (product: Product) => {
    if (product.stockQuantity <= 0) return alert(`'${product.name}' is out of stock.`);
    setBillItems((prev) => {
      const exist = prev.find((i) => i.id === product.id);
      if (exist) {
        if (exist.billQty >= product.stockQuantity) {
          alert(`Max stock for '${product.name}' reached.`);
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, billQty: i.billQty + 1 } : i
        );
      }
      return [...prev, { ...product, billQty: 1, discount: 0 }];
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateQty = (id: string, qty: number) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (qty > p.stockQuantity) return alert(`Max stock is ${p.stockQuantity}.`);
    setBillItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, billQty: qty } : i))
    );
  };

  const updateDiscount = (id: string, val: number) =>
    setBillItems((prev) => prev.map((i) => (i.id === id ? { ...i, discount: val } : i)));

  const totals = useMemo(() => {
    let s = 0,
      d = 0;
    billItems.forEach((i) => {
      s += i.billQty * i.price;
      d += i.discount;
    });
    return { subTotal: s, discount: d, total: s - d };
  }, [billItems]);

  useEffect(() => {
    if (!searchTerm.trim()) return setSearchResults([]);
    try {
      const term = searchTerm.toLowerCase();
      const res = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.id.toString().includes(term)
      );
      setSearchResults(res);
    } catch {
      setSearchResults([]);
    }
  }, [searchTerm, products]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <>
      {/* Hidden Print Template */}
      <div className="hidden">
        <BillToPrint
          ref={billRef}
          items={billItems.map((i) => ({
            ...i,
            subtotal: i.billQty * i.price - i.discount,
          }))}
          total={totals.total}
          subTotal={totals.subTotal}
          discount={totals.discount}
          billNo={pastBills[0]?.invoiceId || 'INV-XXXX'}
          customerName={customerName}
        />
      </div>

      <div className="flex h-full gap-6 p-6 bg-gray-100">
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>

          {/* Customer Inputs */}
          <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
            />
            <input
              placeholder="Phone No."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="form-input"
            />
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="form-input"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {/* Product Search */}
          <div className="bg-white p-4 rounded-lg shadow-sm flex-grow flex flex-col">
            <div className="relative mb-4">
              <input
                placeholder="Enter Product Code or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full ring-2 ring-blue-500"
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-gray-500">₹{p.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bill Table */}
            <div className="flex-1 overflow-y-auto border-t border-b">
              <table className="w-full text-left">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((i) => {
                    const subtotal = i.billQty * i.price - i.discount;
                    return (
                      <tr key={i.id} className="border-b">
                        <td className="p-2 font-medium">{i.name}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(i.id, i.billQty - 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Minus size={14} />
                            </button>
                            <span>{i.billQty}</span>
                            <button
                              onClick={() => updateQty(i.id, i.billQty + 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="p-2">₹{i.price.toFixed(2)}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={i.discount}
                            onChange={(e) =>
                              updateDiscount(i.id, parseFloat(e.target.value) || 0)
                            }
                            className="form-input w-20 text-right"
                          />
                        </td>
                        <td className="p-2 font-semibold">₹{subtotal.toFixed(2)}</td>
                        <td className="p-2">
                          <button
                            onClick={() => updateQty(i.id, 0)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals + Buttons */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={clearBill}
                  className="px-6 py-2 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300"
                >
                  Reset / F12
                </button>
                <button
                  onClick={() => billItems.length && handlePrint()}
                  className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
                >
                  Print / F9
                </button>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-blue-600">
                  Total: ₹{totals.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Summary */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-sm text-gray-500">Last Bill Amount</p>
            <p className="text-2xl font-bold text-orange-500">
              ₹{pastBills[0]?.total?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm space-y-2 text-lg">
            <div className="flex justify-between">
              <span>Sub Total:</span> <span>₹{totals.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span> <span>₹{totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-blue-600 border-t pt-2 mt-2">
              <span>Total:</span> <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Billing;
