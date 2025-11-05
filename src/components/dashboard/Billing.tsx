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
  Undo2,
  RefreshCw,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";


// --- Interfaces (unchanged) ---
interface Product { barcode: string; name: string; price: number; quantity: number; }
interface BillItem extends Product { qty: number; total: number; GST: number; Discount: number; }

// --- Invoice Number Generation (unchanged) ---
const generateInvoiceNumber = (): string => {
  let counter = parseInt(localStorage.getItem("invoiceCounter") || "1");
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear();
  const formattedDate = `${day}${month}${year}`;
  const invoiceNumber = `TGT/${formattedDate}/${counter}`;
  localStorage.setItem("invoiceCounter", (counter + 1).toString());
  return invoiceNumber;
};


// --- Return Modal Component (unchanged) ---
const ReturnModal = ({ onFind, onClose }: { onFind: (invoiceId: string) => void; onClose: () => void; }) => {
  const [invoiceId, setInvoiceId] = useState("");
  const handleFindClick = () => { if (invoiceId.trim()) { onFind(invoiceId.trim()); } };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Find Bill for Return</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button></div>
        <div className="flex gap-2">
          <input type="text" placeholder="Enter Invoice Number..." value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="form-input flex-grow"/>
          <button onClick={handleFindClick} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600">Find</button>
        </div>
      </motion.div>
    </div>
  );
};

const Billing: React.FC = () => {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [holds, setHolds] = useState<any[]>([]);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isReturnMode, setIsReturnMode] = useState(false);
  
  const [shopName] = useLocalStorage('shopName', 'T.Gopi Textiles');
  const [gstNumber] = useLocalStorage('gstNumber', 'YOUR_GST_NUMBER_HERE');
  const [billMessage] = useLocalStorage('billMessage', 'Thank You For Your Purchasing');

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

  const calculateItemTotal = (price: number, qty: number, discountPercent: number, gstPercent: number): number => {
    const subtotal = price * qty;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = taxableAmount * (gstPercent / 100);
    const finalTotal = taxableAmount + gstAmount;
    return finalTotal;
  };

  const handleAddProduct = async () => {
    if (!barcode || barcode.trim() === "" || barcode === "null") return;
    try {
      setLoading(true);
      const formattedBarcode = barcode.padStart(7, "0");
      const res = await billingService.get(`/billing/product/${encodeURIComponent(formattedBarcode)}`);
      const product = res.data;
      setItems((prev) => {
        const existingItem = prev.find((i) => i.barcode === product.barcode);
        if (existingItem) {
          return prev.map((i) =>
            i.barcode === product.barcode
              ? { ...i, qty: i.qty + 1, total: calculateItemTotal(i.price, i.qty + 1, i.Discount, i.GST) }
              : i
          );
        } else {
          const newItem: BillItem = {
            barcode: product.barcode, name: product.name, price: product.price,
            GST: product.purchaseGst || 0, Discount: product.discount || 0,
            quantity: product.quantity ?? 1, qty: 1,
            total: calculateItemTotal(product.price, 1, product.discount || 0, product.purchaseGst || 0),
          };
          return [...prev, newItem];
        }
      });
      setBarcode("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Product not found!");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (barcode: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setItems((prev) =>
      prev.map((i) =>
        i.barcode === barcode
          ? { ...i, qty: validQty, total: calculateItemTotal(i.price, validQty, i.Discount, i.GST) }
          : i
      )
    );
  };

  const handleDiscountChange = (barcode: string, discount: number) => {
    const validDiscount = Math.max(0, Math.min(100, discount));
    setItems((prev) =>
      prev.map((i) =>
        i.barcode === barcode
          ? { ...i, Discount: validDiscount, total: calculateItemTotal(i.price, i.qty, validDiscount, i.GST) }
          : i
      )
    );
  };

  const handleRemoveItem = (barcode: string) => setItems((prev) => prev.filter((i) => i.barcode !== barcode));

  const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

  const parsedReceivedAmount = parseFloat(receivedAmount) || 0;
  const changeDue = (paymentMethod === 'Cash' && parsedReceivedAmount > totalAmount) ? parsedReceivedAmount - totalAmount : 0;
// ✅ New Firestore-based invoice retrieval
const handleFindBill = async (invoiceId: string) => {
  try {
    setLoading(true);

    // Try Firestore first
    const docRef = doc(db, "bills", invoiceId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const bill = snapshot.data();
      console.log("✅ Bill found in Firestore:", bill);

      if (!bill.items || bill.items.length === 0) {
        alert(`No items found for invoice ${invoiceId}.`);
        setLoading(false);
        return;
      }

      // Map Firestore items to local BillItem structure
      setItems(bill.items.map((i: any) => ({
        barcode: i.productId || "",
        name: i.productName || "",
        price: parseFloat(i.unitPrice || 0),
        qty: parseInt(i.quantity || 1),
        total: parseFloat(i.netAmount || 0),
        GST: parseFloat(i.gstRate || 0),
        Discount: parseFloat(i.discountRate || 0),
      })));

      setCustomerName(bill.customerName || "");
      setCustomerPhone(bill.customerPhone ? bill.customerPhone.toString() : "");
      setPaymentMethod(bill.paymentMethod || "Cash");
      setIsReturnMode(true);
      setIsReturnModalOpen(false);

      alert(`✅ Bill ${invoiceId} loaded successfully!`);
    } else {
      alert(`❌ No bill found with ID: ${invoiceId}`);
    }
  } catch (err) {
    console.error("🔥 Firestore retrieval error:", err);
    alert("Failed to fetch bill from Firestore. Check console for details.");
  } finally {
    setLoading(false);
  }
};


  const handleRestoreStock = async (barcode: string, qty: number) => {
    if (window.confirm(`Are you sure you want to return ${qty} unit(s) of product ${barcode} to stock?`)) {
      try {
        setLoading(true);
        await billingService.post('/return/stock', { productId: barcode, quantity: qty });
        alert(`Product ${barcode} restored to stock.`);
        handleRemoveItem(barcode);
      } catch (err: any) {
        alert(err.response?.data?.error || `Failed to restore stock for ${barcode}.`);
      } finally {
        setLoading(false);
      }
    }
  };

 const handleSaveBill = async () => {
  if (!items.length) throw new Error("Add at least one item!");

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
      subtotal: i.price * i.qty,
      netAmount: i.total,
      discountRate: i.Discount || 0,
      gstRate: i.GST || 0,
    })),
    totalDiscountAmount: 0,
    totalGstAmount: 0,
    finalAmount: totalAmount,
    createdAt: new Date(),
  };

  try {
    // 🔹 Step 1: Save the bill
    const response = await billingService.post("/billing/create", billData);
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Failed to create bill");
    }

    // 🔹 Step 2: Fetch latest bill from Firestore
    const latestRes = await billingService.get("/billing/all");
    const allBills: any[] = latestRes.data || [];

    // 🔹 Step 3: Sort by createdAt (most recent first)
    const sorted = [...allBills].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // 🔹 Step 4: Return latest bill ID
    const latestBill = sorted.length > 0 ? sorted[0] : null;
    if (!latestBill || !latestBill.id) {
      throw new Error("No latest bill found!");
    }

    console.log("✅ Latest bill fetched:", latestBill);
    return latestBill.id;
  } catch (err) {
    console.error("🔥 Failed to create bill:", err);
    throw new Error("Failed to create bill");
  }
};


  
  // --- SENIOR DEV FIX: Updated font-family for better readability ---
  const handlePrint = (invoiceNumber: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Could not open print window. Please disable your popup blocker.");
      return;
    }
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}`;
    const finalReceivedAmount = parsedReceivedAmount > 0 ? parsedReceivedAmount : totalAmount;

    let totalGstAmount = 0;
    let totalDiscountAmount = 0;
    let totalTaxableAmount = 0;
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

    items.forEach(item => {
        const subtotal = item.price * item.qty;
        const discountAmount = subtotal * (item.Discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const gstAmount = taxableAmount * (item.GST / 100);
        
        totalTaxableAmount += taxableAmount;
        totalGstAmount += gstAmount;
        totalDiscountAmount += discountAmount;
    });

    const effectiveGstRate = totalTaxableAmount > 0 ? (totalGstAmount / totalTaxableAmount) * 100 : 0;

    const billHTML = `
      <html><head><title>Invoice - ${invoiceNumber}</title>
      <style>
        @page { margin: 5mm; }
        body { 
            /* FIX: Changed font to a clearer, modern sans-serif stack */
            font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; 
            font-size: 9.5pt; 
            color: #000; 
            margin: 0; 
            padding: 0; 
            background-color: #fff;
            font-weight: bold;
        }
        .invoice-container { width: 72mm; margin: 0 auto; padding: 5px; }
        .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; }
        
        .sep-single { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .sep-double { border: none; border-top: 3px double #000; margin: 5px 0; }
        
        table { width: 100%; border-collapse: collapse; } 
        th, td { padding: 2px 0; vertical-align: top;}

        .header h1 { font-size: 14pt; margin: 0; } 
        .header p { font-size: 9pt; margin: 1px 0; }
        
        .meta-info td { font-size: 9pt; padding: 1px 0; }
        
        .items-table { border: 1px solid #000; font-size: 9pt; }
        .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            vertical-align: middle;
        }
        .items-table th { font-weight: bold; }

        .totals-table { font-size: 10pt; }
        .totals-table td { padding: 3px 0; }
        .totals-table .final-row { font-size: 12pt; }
        .payment-info td { border-top: 1px dashed #000; padding-top: 5px; }

        .footer { font-size: 8pt; margin-top: 10px; text-align: left; }
        .footer ul { padding-left: 15px; margin: 5px 0 0; list-style-position: outside; }
      </style></head>
      <body><div class="invoice-container">
        
        <div class="header text-center">
            <h1>${shopName}</h1>
            <p>GSTIN NO: ${gstNumber}</p>
        </div>
        
        <div class="sep-single"></div>
        
        <h2 class="text-center" style="font-size:11pt; margin: 5px 0;">INVOICE / BILL</h2>
        <table class="meta-info">
            <tr><td class="text-left" style="width: 50%;">Invoice No:</td><td class="text-right">${invoiceNumber}</td></tr>
            <tr><td class="text-left">Date & Time:</td><td class="text-right">${formattedDate}</td></tr>
            <tr><td class="text-left">Cashier:</td><td class="text-right">TGT-Cashier01</td></tr>
        </table>
        
        <div class="sep-single"></div>

        <table class="meta-info">
            <tr><td class="text-left">Customer:</td><td class="text-right">${customerName || 'WALK-IN'}</td></tr>
            <tr><td class="text-left">Contact:</td><td class="text-right">${customerPhone || 'N/A'}</td></tr>
        </table>

        <div class="sep-double"></div>
        
        <table class="items-table">
          <thead>
            <tr>
                <th class="text-left" style="width: 40%;">PARTICULARS</th>
                <th class="text-center" style="width: 10%;">QTY</th>
                <th class="text-center" style="width: 10%;">DIS</th>
                <th class="text-right" style="width: 20%;">RATE</th>
                <th class="text-right" style="width: 20%;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
          ${items.map((i, idx) => `
            <tr>
                <td class="text-left">${i.name}</td>
                <td class="text-center">${i.qty}</td>
                <td class="text-center">${i.Discount}</td>
                <td class="text-right">${i.price.toFixed(2)}</td>
                <td class="text-right">${i.total.toFixed(2)}</td>
            </tr>
          `).join('')}
          </tbody>
        </table>
        
        <div class="sep-double"></div>
        
        <table class="totals-table">
            <tr><td class="text-left">Items Count: ${items.length}</td><td class="text-right">Total Qty: ${totalQty}</td></tr>
            <tr><td class="text-left">Total Discount</td><td class="text-right">₹${totalDiscountAmount.toFixed(2)}</td></tr>
            <tr><td class="text-left">Taxable Amount</td><td class="text-right">₹${totalTaxableAmount.toFixed(2)}</td></tr>
            <tr><td class="text-left">Total GST @ ${effectiveGstRate.toFixed(2)}%</td><td class="text-right">₹${totalGstAmount.toFixed(2)}</td></tr>
            <tr class="final-row"><td class="text-left">GRAND TOTAL</td><td class="text-right">₹${totalAmount.toFixed(2)}</td></tr>
        </table>

        <div class="sep-single"></div>

        <table class="totals-table payment-info">
            <tr><td class="text-left">Payment Mode: ${paymentMethod}</td><td class="text-right"></td></tr>
            <tr><td class="text-left">Amount Paid</td><td class="text-right">₹${finalReceivedAmount.toFixed(2)}</td></tr>
            ${paymentMethod === 'Cash' && changeDue > 0 ? `<tr><td class="text-left" style="color: green;">CHANGE DUE</td><td class="text-right" style="color: green;">₹${changeDue.toFixed(2)}</td></tr>` : ''}
        </table>
        
        <div class="sep-single"></div>
        
        <div class="footer">
            <p class="text-center" style="margin-bottom: 5px;">Terms & Conditions</p>
            <ul>
                <li>All offers are subject to their respective T&Cs.</li>
                <li>Returns/exchanges accepted within 30 days.</li>
                <li>No returns on Underwear, Cosmetics, Accessories.</li>
                <li>Bras & Vests can be exchanged post-inspection.</li>
                <li>Discounts include applicable GST adjustments.</li>
                <li>Credit note for items with manufacturing defects.</li>
            </ul>
        </div>
        
        <div class="footer text-center">
            <p style="margin: 10px 0;">----------------------------------</p>
            <p>*** ${billMessage} ***</p>
            <p style="margin-top: 5px;">Invoice ID: ${invoiceNumber}</p>
        </div>
      </div></body></html>`;
    // Write and print
    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    setTimeout(() => {
        try {
            printWindow.close();
        } catch (e) {
            console.error("Failed to close print window automatically.", e);
        }
    }, 100);
  };

  // --- SENIOR DEV FIX: Re-ordered operations to prevent popup blocking ---
  const handleSaveAndPrint = async () => {
  if (!items.length) {
    alert("Add at least one item!");
    return;
  }

  try {
    const billId = await handleSaveBill(); // ✅ Firestore ID fetched
    handlePrint(billId); // ✅ Print actual Firestore ID
    alert(`✅ Bill ${billId} created and printed successfully!`);
    handleReset();
  } catch (err: any) {
    console.error("🔥 Error in save & print:", err);
    alert(err.response?.data?.error || "Failed to create bill.");
  }
};


  const handleHoldBill = async () => {
    if (!items.length) return alert("No items to hold!");
    try {
      setLoading(true);
      const billData = {
        customerName, customerPhone: Number(customerPhone) || 0, paymentMethod: "HOLD", status: "HOLD",
        items: items.map((i) => ({
          productId: i.barcode, quantity: i.qty, productName: i.name, unitPrice: i.price,
          subtotal: i.price * i.qty, netAmount: i.total, discountRate: i.Discount || 0,
        })),
        totalDiscountAmount: 0, totalGstAmount: 0, finalAmount: totalAmount, createdAt: new Date(),
      };
      const res = await billingService.post("/billing/puthold", billData);
      if (res.status === 200 || res.status === 201) {
        alert("🟡 Bill placed on hold!");
        await fetchHoldBills();
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

  const handleRetrieveHold = (bill: any) => {
    const retrievedPaymentMethod = bill.paymentMethod === 'HOLD' ? 'Cash' : bill.paymentMethod || "Cash";
    const totalDue = parseFloat(bill.finalAmount) || 0;
    
    setItems(bill.items.map((i: any) => ({
      barcode: i.productId, name: i.productName, price: parseFloat(i.unitPrice),
      qty: i.quantity, total: parseFloat(i.netAmount), quantity: i.quantity,
      GST: parseFloat(i.gstRate || 0), Discount: parseFloat(i.discountRate || 0),
    })));
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
    setPaymentMethod(retrievedPaymentMethod);
    
    setReceivedAmount(totalDue.toFixed(2));
  };


const handleDeleteHeldBill = async (billId: string, event: React.MouseEvent) => {
  event.stopPropagation();
  if (window.confirm('Mark this held bill as PAID and remove it from held bills?')) {
    try {
      await billingService.put(`/billing/${billId}/pay`);
      alert('✅ Bill cancelled successfully!');
      await fetchHoldBills(); // Refresh the held bills list
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to update bill ${billId}.`);
    }
  }
};


  const handleReset = () => {
    setItems([]); setBarcode(""); setCustomerName(""); setCustomerPhone("");
    setPaymentMethod("Cash"); setReceivedAmount("");
    setIsReturnMode(false);
  };

  const exportToExcel = () => {
    const wb = utils.book_new();
    const data = items.map((i, idx) => ({
      SN: idx + 1, Customer: customerName, Phone: customerPhone, Payment: paymentMethod,
      Product: i.name, Quantity: i.qty, Price: i.price, Total: i.total,
    }));
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, "Bill");
    writeFile(wb, `${customerName || "Bill"}.xlsx`);
  };

  return (
    <>
      {isReturnModalOpen && <ReturnModal onFind={handleFindBill} onClose={() => setIsReturnModalOpen(false)} />}
      <motion.div
        className="p-10 bg-gradient-to-br from-indigo-50 to-blue-100 shadow-2xl rounded-3xl space-y-8 backdrop-blur-xl border border-white/40"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-extrabold text-blue-900 flex items-center gap-3 drop-shadow-sm">
          <ShoppingCart className="text-blue-700" /> 
          {isReturnMode ? "Return Processing" : "Smart Billing Dashboard"}
        </h1>

        <motion.div className="flex items-center space-x-3" whileHover={{ scale: isReturnMode ? 1 : 1.01 }}>
          <div className="relative w-80"><PackageSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Scan / Enter code" value={barcode}
              onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
              className="pl-10 pr-4 py-2.5 w-full border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm bg-white/90 backdrop-blur"
              disabled={isReturnMode}
            />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddProduct} disabled={loading || isReturnMode}
            className={`px-6 py-2.5 rounded-xl font-semibold shadow-md transition-colors ${isReturnMode ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >{loading ? "Adding..." : "Add Product"}</motion.button>
        </motion.div>

        <motion.div className="bg-white/80 rounded-2xl shadow-lg overflow-hidden border border-blue-100 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 text-sm text-gray-700">
              <tr>
                <th className="p-3 text-center">S. NO</th><th className="p-3 text-left">Product ID</th>
                <th className="p-3 text-left">Product Name</th><th className="p-3 text-center">Price</th>
                <th className="p-3 text-center">Qty</th><th className="p-3 text-center">Discount (%)</th>
                <th className="p-3 text-center">GST (%)</th><th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <motion.tr key={i.barcode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="border-t hover:bg-blue-50/60 transition"
                >
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2 text-left font-mono">{i.barcode}</td>
                  <td className="p-2 text-left font-medium">{i.name}</td>
                  <td className="p-2 text-center">₹{i.price.toFixed(2)}</td>
                  <td className="p-2 text-center"><input type="number" value={i.qty} min={1} onChange={(e) => handleQtyChange(i.barcode, Number(e.target.value))} className="border w-16 p-1 rounded mx-auto text-center" disabled={isReturnMode} /></td>
                  <td className="p-2 text-center"><input type="number" value={i.Discount} min={0} max={100} onChange={(e) => handleDiscountChange(i.barcode, Number(e.target.value))} className="border w-16 p-1 rounded mx-auto text-center" disabled={isReturnMode} /></td>
                  <td className="p-2 text-center">{i.GST}%</td>
                  <td className="p-2 text-center font-semibold">₹{i.total.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    {isReturnMode ? (
                      <button onClick={() => handleRestoreStock(i.barcode, i.qty)} className="text-green-600 hover:text-green-800" title="Restore to Stock">
                        <RefreshCw size={18} />
                      </button>
                    ) : (
                      <button className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleRemoveItem(i.barcode)}>✖</button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="space-y-6">
          {!isReturnMode && (
            <>
              <div className="flex justify-between items-start">
                <div className="text-3xl font-bold text-blue-900 drop-shadow">
                  Total: ₹{totalAmount.toFixed(2)}
                </div>
                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-4">
                    {paymentMethod === "Cash" && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                        <input type="number" placeholder="Amount Received" value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          className="pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl w-48 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3 bg-white/70 backdrop-blur px-4 py-2 rounded-xl border">
                      <span className="font-semibold text-blue-900">Payment:</span>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                        className="border border-blue-300 rounded-lg px-2 py-1 text-blue-800 bg-white focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="Cash">💵 Cash</option><option value="Card">💳 Card</option>
                        <option value="UPI">📱 UPI</option><option value="Other">🏦 Other</option>
                      </select>
                    </div>
                  </div>
                  {changeDue > 0 && (<div className="text-xl font-bold text-green-600 bg-green-100 px-4 py-2 rounded-lg">Change Due: ₹{changeDue.toFixed(2)}</div>)}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="relative w-64"><User className="absolute left-3 top-2.5 text-gray-400" /><input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"/></div>
                <div className="relative w-64"><Phone className="absolute left-3 top-2.5 text-gray-400" /><input type="text" placeholder="Customer Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"/></div>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-4 pt-6 justify-center">
            {!isReturnMode && (
              <>
                <motion.button whileHover={{ scale: 1.08 }} onClick={handleSaveAndPrint} className="bg-green-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg"><Save size={18} /> Save & Print</motion.button>
                <motion.button whileHover={{ scale: 1.08 }} onClick={handleHoldBill} className="bg-yellow-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-yellow-600 shadow-lg"><Pause size={18} /> Hold</motion.button>
                <motion.button whileHover={{ scale: 1.08 }} onClick={() => setIsReturnModalOpen(true)} className="bg-orange-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-orange-600 shadow-lg"><Undo2 size={18} /> Return Bill</motion.button>
                <motion.button whileHover={{ scale: 1.08 }} onClick={exportToExcel} className="bg-gray-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-800 shadow-lg"><FileSpreadsheet size={18} /> Excel</motion.button>
              </>
            )}
            <motion.button whileHover={{ scale: 1.08 }} onClick={handleReset} className="bg-red-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-lg">
              <RotateCcw size={18} /> {isReturnMode ? "Exit Return Mode" : "Reset"}
            </motion.button>
          </div>

          {!isReturnMode && holds.length > 0 && (
            <div className="mt-10 border-t pt-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-700">🟡 Held Bills</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holds.map((h) => (
                  <motion.div key={h.id} onClick={() => handleRetrieveHold(h)} whileHover={{ scale: 1.04 }}
                    className="relative p-4 border rounded-2xl bg-yellow-50 hover:bg-yellow-100 cursor-pointer shadow-md transition"
                  >
                    <button onClick={(e) => handleDeleteHeldBill(h.id, e)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors z-10" title="Delete Held Bill">
                      <X size={16} />
                    </button>
                    <div className="font-bold text-gray-800">{h.customerName || "Unnamed"}</div>
                    <div className="text-sm text-gray-600">{h.items?.length} items — ₹{h.finalAmount}</div>
                    <div className="text-xs text-yellow-700 mt-1">Payment: {h.paymentMethod || "Cash"}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Billing;