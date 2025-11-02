import React, { useState, useEffect } from "react";
import { billingService } from "@/lib/api";
import { utils, writeFile } from "xlsx";
import {
  Printer,
  Save,
  RotateCcw,
  Pause,
  FileSpreadsheet,
  ShoppingCart,
  User,
  Phone,
  PackageSearch,
} from "lucide-react";
import { motion } from "framer-motion";

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

  // Fetch held bills
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

  // Add Product
  const handleAddProduct = async () => {
    if (!barcode || barcode.trim() === "" || barcode === "null") return;
    try {
      setLoading(true);
      const res = await billingService.get(`/billing/product/${encodeURIComponent(barcode)}`);
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

  // Save Bill
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

  // Hold Bill
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
      fetchHoldBills();
      handleReset();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to hold bill.");
    }
  };

  // Retrieve Hold
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

  // Reset Bill
  const handleReset = () => {
    setItems([]);
    setBarcode("");
    setCustomerName("");
    setCustomerPhone("");
  };

  // Print Bill
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const billHTML = `
      <html>
      <head><title>Bill - ${customerName}</title></head>
      <body style="font-family:sans-serif;">
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

  // Export Excel
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
    <motion.div
      className="p-8 bg-gradient-to-br from-indigo-50 to-blue-100 shadow-2xl rounded-2xl space-y-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-3xl font-extrabold text-blue-900 flex items-center gap-3">
        <ShoppingCart className="text-blue-600" /> Smart Billing Panel
      </h1>

      {/* Barcode Input */}
      <div className="flex items-center space-x-3">
        <div className="relative w-72">
          <PackageSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Scan / Enter Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
            className="pl-10 pr-4 py-2 w-full border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm bg-white"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddProduct}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md"
        >
          {loading ? "Adding..." : "Add Product"}
        </motion.button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
            <tr>
              <th className="p-3">Barcode</th>
              <th className="p-3">Product</th>
              <th className="p-3">Price</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Total</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <motion.tr
                key={i.barcode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t hover:bg-blue-50"
              >
                <td className="p-2">{i.barcode}</td>
                <td className="p-2 font-medium">{i.name}</td>
                <td className="p-2 text-center">₹{i.price}</td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={i.qty}
                    min={1}
                    onChange={(e) => handleQtyChange(i.barcode, Number(e.target.value))}
                    className="border w-16 p-1 rounded text-center shadow-sm"
                  />
                </td>
                <td className="p-2 text-center font-semibold">₹{i.total}</td>
                <td
                  className="p-2 text-red-500 cursor-pointer hover:text-red-700"
                  onClick={() => handleRemoveItem(i.barcode)}
                >
                  ✖
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-900">
          Total: ₹{totalAmount.toFixed(2)}
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex space-x-4">
        <div className="relative w-64">
          <User className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative w-64">
          <Phone className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Customer Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 pt-6">
        <motion.button whileHover={{ scale: 1.05 }} onClick={handleSaveBill} className="bg-green-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow">
          <Save size={18} /> Buy
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} onClick={handleHoldBill} className="bg-yellow-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 shadow">
          <Pause size={18} /> Hold
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} onClick={handlePrint} className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow">
          <Printer size={18} /> Print
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} onClick={exportToExcel} className="bg-gray-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 shadow">
          <FileSpreadsheet size={18} /> Excel
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} onClick={handleReset} className="bg-red-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow">
          <RotateCcw size={18} /> Reset
        </motion.button>
      </div>

      {/* Held Bills */}
      {holds.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🟡 Held Bills
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holds.map((h) => (
              <motion.div
                key={h.id}
                onClick={() => handleRetrieveHold(h)}
                whileHover={{ scale: 1.03 }}
                className="p-4 border rounded-xl bg-yellow-50 hover:bg-yellow-100 cursor-pointer shadow-sm transition"
              >
                <div className="font-bold text-gray-800">{h.customerName || "Unnamed"}</div>
                <div className="text-sm text-gray-600">
                  {h.items?.length} items — ₹{h.totalAmount}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Billing;
