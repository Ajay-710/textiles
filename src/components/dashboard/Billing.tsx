import React, { useState, useEffect } from "react";
import { billingService } from "@/lib/api";
import { utils, writeFile } from "xlsx";
import { Printer, Save, RotateCcw, Pause, Play, FileSpreadsheet } from "lucide-react";

interface Product {
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

interface BillItem extends Product {
  qty: number;
  total: number;
}

const Billing: React.FC = () => {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [holds, setHolds] = useState<any[]>([]);

  // --- Fetch held bills from API ---
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

  // --- Add product by barcode ---
  const handleAddProduct = async () => {
    if (!barcode.trim()) return;
    try {
      setLoading(true);
      const res = await billingService.get(`/billing/product/${barcode}`);
      const product = res.data;

      const newItem: BillItem = {
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        quantity: product.quantity ?? 1,
        qty: 1,
        total: product.price,
      };

      setItems((prev) => {
        const existing = prev.find((i) => i.barcode === barcode);
        if (existing)
          return prev.map((i) =>
            i.barcode === barcode
              ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price }
              : i
          );
        return [...prev, newItem];
      });

      setBarcode("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Product not found!");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (barcode: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.barcode === barcode ? { ...i, qty, total: qty * i.price } : i
      )
    );

  const handleRemoveItem = (barcode: string) =>
    setItems((prev) => prev.filter((i) => i.barcode !== barcode));

  const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

  // --- Save Bill ---
  const handleSaveBill = async () => {
    if (!items.length) return alert("Add at least one item!");
    try {
      const billData = {
        customerName,
        customerPhone,
        items: items.map((i) => ({
          productBarcode: i.barcode,
          quantity: i.qty,
          total: i.total,
        })),
        totalAmount,
      };
      await billingService.post("/billing/create", billData);
      alert("✅ Bill created successfully!");
      handleReset();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create bill.");
    }
  };

  // --- Hold Bill ---
  const handleHoldBill = async () => {
    if (!items.length) return alert("No items to hold!");
    try {
      const billData = {
        customerName,
        customerPhone,
        items: items.map((i) => ({
          productBarcode: i.barcode,
          quantity: i.qty,
          total: i.total,
        })),
        totalAmount,
      };
      await billingService.post("/billing/puthold", billData);
      alert("🟡 Bill placed on hold!");
      handleReset();
      fetchHoldBills();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to hold bill.");
    }
  };

  // --- Retrieve Hold ---
  const handleRetrieveHold = async (bill: any) => {
    setItems(
      bill.items.map((i: any) => ({
        barcode: i.productBarcode,
        name: i.productName,
        price: i.price,
        qty: i.quantity,
        total: i.total,
        quantity: i.quantity,
      }))
    );
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
  };

  // --- Reset / Clear ---
  const handleReset = () => {
    setItems([]);
    setBarcode("");
    setCustomerName("");
    setCustomerPhone("");
  };

  // --- Print Bill ---
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const billHTML = `
      <html>
      <head><title>Bill - ${customerName}</title></head>
      <body>
        <h2 style="text-align:center;">T.Gopi Textiles</h2>
        <h4>Customer: ${customerName} | ${customerPhone}</h4>
        <table border="1" cellspacing="0" cellpadding="6" width="100%">
          <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          ${items
            .map(
              (i) =>
                `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price}</td><td>${i.total}</td></tr>`
            )
            .join("")}
        </table>
        <h3>Total: ₹${totalAmount.toFixed(2)}</h3>
      </body>
      </html>
    `;
    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // --- Export Excel ---
  const exportToExcel = () => {
    const wb = utils.book_new();
    const data = items.map((i) => ({
      Customer: customerName,
      Phone: customerPhone,
      Product: i.name,
      Quantity: i.qty,
      Price: i.price,
      Total: i.total,
    }));
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, "Bill");
    writeFile(wb, `${customerName || "Bill"}.xlsx`);
  };

  return (
    <div className="p-8 bg-white shadow rounded-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🧾 Billing Panel</h1>

      {/* Barcode Input */}
      <div className="flex space-x-3">
        <input
          type="text"
          placeholder="Scan / Enter Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
          className="border p-2 w-64 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Table */}
      <table className="w-full border rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Barcode</th>
            <th className="p-2">Product</th>
            <th className="p-2">Price</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Total</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.barcode} className="border-t">
              <td className="p-2">{i.barcode}</td>
              <td className="p-2">{i.name}</td>
              <td className="p-2">₹{i.price}</td>
              <td className="p-2">
                <input
                  type="number"
                  value={i.qty}
                  min={1}
                  onChange={(e) =>
                    handleQtyChange(i.barcode, Number(e.target.value))
                  }
                  className="border w-16 p-1 rounded text-center"
                />
              </td>
              <td className="p-2">₹{i.total}</td>
              <td className="p-2 text-red-500 cursor-pointer" onClick={() => handleRemoveItem(i.barcode)}>
                ✖
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="text-right text-lg font-semibold text-gray-800">
        Total: ₹{totalAmount.toFixed(2)}
      </div>

      {/* Customer Info */}
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="border p-2 rounded-md w-64"
        />
        <input
          type="text"
          placeholder="Customer Phone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="border p-2 rounded-md w-64"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 pt-4">
        <button onClick={handleSaveBill} className="bg-green-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Save size={18} /> Buy
        </button>
        <button onClick={handleHoldBill} className="bg-yellow-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600">
          <Pause size={18} /> Hold
        </button>
        <button onClick={handlePrint} className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Printer size={18} /> Print
        </button>
        <button onClick={exportToExcel} className="bg-gray-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
          <FileSpreadsheet size={18} /> Excel
        </button>
        <button onClick={handleReset} className="bg-red-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
          <RotateCcw size={18} /> Reset
        </button>
      </div>

      {/* Held Bills */}
      {holds.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">🟡 Held Bills</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {holds.map((h) => (
              <div
                key={h.id}
                onClick={() => handleRetrieveHold(h)}
                className="p-3 border rounded-lg bg-yellow-50 hover:bg-yellow-100 cursor-pointer"
              >
                <div className="font-semibold">{h.customerName || "Unnamed"}</div>
                <div className="text-sm text-gray-600">
                  {h.items?.length} items — ₹{h.totalAmount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
