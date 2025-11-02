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
  const [paymentMethod, setPaymentMethod] = useState("Cash");
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

  // ✅ Save Bill
  const handleSaveBill = async () => {
    if (!items.length) return alert("Add at least one item!");

    try {
      const billData = {
        customerName,
        customerPhone: Number(customerPhone) || 0,
        paymentMethod,
        status: "PAID",
        items: items.map((i) => ({
          productId: i.barcode,
          quantity: i.qty,
          productName: i.name,
          unitPrice: i.price,
          subtotal: i.total,
          netAmount: i.total,
        })),
        totalDiscountAmount: 0,
        totalGstAmount: 0,
        finalAmount: totalAmount,
        createdAt: new Date(),
      };

      await billingService.post("/billing/create", billData);
      alert("✅ Bill created successfully!");
      handleReset();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create bill.");
    }
  };

  // ✅ Fixed Hold Bill Logic
  const handleHoldBill = async () => {
    if (!items.length) {
      alert("No items to hold!");
      return;
    }

    try {
      setLoading(true);

      const billData = {
        customerName,
        customerPhone: Number(customerPhone) || 0,
        paymentMethod: "HOLD",
        status: "HOLD",
        items: items.map((i) => ({
          productId: i.barcode,
          quantity: i.qty,
          productName: i.name,
          unitPrice: i.price,
          subtotal: i.total,
          netAmount: i.total,
        })),
        totalDiscountAmount: 0,
        totalGstAmount: 0,
        finalAmount: totalAmount,
        createdAt: new Date(),
      };

      console.log("Sending hold bill data:", billData);

      const res = await billingService.post("/billing/puthold", billData);

      if (res.status === 200 || res.status === 201) {
        alert("🟡 Bill placed on hold!");
        await fetchHoldBills();
        // Delay reset to avoid null barcode triggering unwanted GET
        setTimeout(() => handleReset(), 300);
      } else {
        alert("Failed to hold bill. Please try again.");
      }
    } catch (err: any) {
      console.error("Error holding bill:", err);
      alert(err.response?.data?.error || "Failed to hold bill.");
    } finally {
      setLoading(false);
    }
  };

  // Retrieve Hold
  const handleRetrieveHold = async (bill: any) => {
    setItems(
      bill.items.map((i: any) => ({
        barcode: i.productId,
        name: i.productName,
        price: i.unitPrice,
        qty: i.quantity,
        total: i.netAmount,
        quantity: i.quantity,
      }))
    );
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
    setPaymentMethod(bill.paymentMethod || "Cash");
  };

  // Reset Bill
  const handleReset = () => {
    setItems([]);
    setBarcode("");
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("Cash");
  };

  // Print Bill
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const billHTML = `
      <html>
      <head><title>Bill - ${customerName}</title></head>
      <body style="font-family:sans-serif;">
        <h2 style="text-align:center;">🧾 T.Gopi Textiles</h2>
        <h4>Customer: ${customerName} | ${customerPhone}</h4>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
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
      Payment: paymentMethod,
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
      className="p-10 bg-gradient-to-br from-indigo-50 to-blue-100 shadow-2xl rounded-3xl space-y-8 backdrop-blur-xl border border-white/40"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <h1 className="text-4xl font-extrabold text-blue-900 flex items-center gap-3 drop-shadow-sm">
        <ShoppingCart className="text-blue-700" /> Smart Billing Dashboard
      </h1>

      {/* Barcode Input */}
      <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.01 }}>
        <div className="relative w-80">
          <PackageSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Scan / Enter Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
            className="pl-10 pr-4 py-2.5 w-full border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm bg-white/90 backdrop-blur"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddProduct}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 shadow-md"
        >
          {loading ? "Adding..." : "Add Product"}
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-white/80 rounded-2xl shadow-lg overflow-hidden border border-blue-100 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
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
                className="border-t hover:bg-blue-50/60 transition"
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
      </motion.div>

      {/* Totals + Payment */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 items-center">
        <div className="text-3xl font-bold text-blue-900 drop-shadow">
          Total: ₹{totalAmount.toFixed(2)}
        </div>

        <div className="flex items-center gap-3 bg-white/70 backdrop-blur px-4 py-2 rounded-xl border">
          <span className="font-semibold text-blue-900">Payment:</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border border-blue-300 rounded-lg px-2 py-1 text-blue-800 bg-white focus:ring-2 focus:ring-blue-400"
          >
            <option value="Cash">💵 Cash</option>
            <option value="Card">💳 Card</option>
            <option value="UPI">📱 UPI</option>
            <option value="Other">🏦 Other</option>
          </select>
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex flex-wrap gap-4">
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 pt-6 justify-center">
        <motion.button whileHover={{ scale: 1.08 }} onClick={handleSaveBill} className="bg-green-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg">
          <Save size={18} /> Save
        </motion.button>
        <motion.button whileHover={{ scale: 1.08 }} onClick={handleHoldBill} className="bg-yellow-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-yellow-600 shadow-lg">
          <Pause size={18} /> Hold
        </motion.button>
        <motion.button whileHover={{ scale: 1.08 }} onClick={handlePrint} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-lg">
          <Printer size={18} /> Print
        </motion.button>
        <motion.button whileHover={{ scale: 1.08 }} onClick={exportToExcel} className="bg-gray-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-800 shadow-lg">
          <FileSpreadsheet size={18} /> Excel
        </motion.button>
        <motion.button whileHover={{ scale: 1.08 }} onClick={handleReset} className="bg-red-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-lg">
          <RotateCcw size={18} /> Reset
        </motion.button>
      </div>

      {/* Held Bills */}
      {holds.length > 0 && (
        <div className="mt-10 border-t pt-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-700">
            🟡 Held Bills
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holds.map((h) => (
              <motion.div
                key={h.id}
                onClick={() => handleRetrieveHold(h)}
                whileHover={{ scale: 1.04 }}
                className="p-4 border rounded-2xl bg-yellow-50 hover:bg-yellow-100 cursor-pointer shadow-md transition"
              >
                <div className="font-bold text-gray-800">
                  {h.customerName || "Unnamed"}
                </div>
                <div className="text-sm text-gray-600">
                  {h.items?.length} items — ₹{h.finalAmount}
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  Payment: {h.paymentMethod || "Cash"}
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
