import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { reportService } from '@/lib/api';
import { Download, ShoppingCart, TrendingUp, Truck } from 'lucide-react';
import { utils, writeFile, read } from 'xlsx';

// --- Data Structures ---
interface PastBill {
  invoiceId: string;
  date: string;
  customerName: string; // Corrected from supplierName
  total: number;
  subTotal: number;
  discount: number;
}
// --- SENIOR DEV FIX: Updated interface to match product data ---
interface PastPurchase {
  productId: string;
  productName: string;
  supplierName: string;
  date: string; // This will be createdAt from the product
  purchaseRate: number;
  gst: number;
  stock: number;
}
interface ProfitData {
  invoiceId: string;
  date: string;
  totalSale: number;
  totalCost: number;
  netProfit: number;
}

type ReportTab = 'sales' | 'profit' | 'purchase';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchReportData = async () => {
      let endpoint = '/reports/sales';
      if (activeTab === 'profit') endpoint = '/reports/profit';
      // --- SENIOR DEV FIX: Use the new endpoint for purchase reports ---
      if (activeTab === 'purchase') endpoint = '/reports/purchases/from-products';

      try {
        setIsLoading(true);
        setError(null);

        const response = await reportService.get(endpoint, {
          params: { startDate: startDate || null, endDate: endDate || null },
          responseType: 'arraybuffer',
        });

        const workbook = read(response.data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = utils.sheet_to_json(sheet, { raw: false });

        setFilteredData(jsonData);
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(`Could not load ${activeTab} report. Is the backend service running?`);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchReportData();
      } else {
        setIsLoading(false);
        setError('You are not logged in.');
      }
    });

    return () => unsubscribe();
  }, [activeTab, startDate, endDate]);

  const handleExportToExcel = () => {
    if (!filteredData || filteredData.length === 0) return alert('No data to export');

    const ws = utils.json_to_sheet(filteredData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, `${activeTab}_report`);
    writeFile(wb, `${activeTab}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderReportTable = () => {
    if (isLoading) return <div className="text-center py-10">Loading report...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
    if (filteredData.length === 0) return <div className="text-center py-10 text-gray-500">No data found for the selected criteria.</div>;

    switch (activeTab) {
      case 'profit':
        return <ProfitReportTable data={filteredData as ProfitData[]} />;
      case 'purchase':
        return <PurchaseReportTable data={filteredData as PastPurchase[]} />;
      default:
        return <SalesReportTable data={filteredData as PastBill[]} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Reports Dashboard</h1>
        <button
          onClick={handleExportToExcel}
          className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2"
        >
          <Download size={18} /> Export Current View
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm flex items-end gap-4">
        <div>
          <label htmlFor="startDate">From Date</label>
          <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input mt-1" />
        </div>
        <div>
          <label htmlFor="endDate">To Date</label>
          <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input mt-1" />
        </div>
      </div>

      <div className="bg-white p-2 rounded-lg shadow-sm flex gap-2">
        <TabButton icon={ShoppingCart} label="Sales Report" isActive={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
        <TabButton icon={TrendingUp} label="Profit Report" isActive={activeTab === 'profit'} onClick={() => setActiveTab('profit')} />
        <TabButton icon={Truck} label="Purchase Report" isActive={activeTab === 'purchase'} onClick={() => setActiveTab('purchase')} />
      </div>

      {renderReportTable()}
    </div>
  );
};

const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-2 ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
    <Icon size={18} /> {label}
  </button>
);

const SalesReportTable = ({ data }: { data: PastBill[] }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-x-auto mt-4">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="p-4">S.No</th>
          <th className="p-4">Customer Name</th>
          <th className="p-4">Invoice ID</th>
          <th className="p-4">Date</th>
          <th className="p-4">Total</th>
          <th className="p-4">Sub Total</th>
          <th className="p-4">Discount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((bill, index) => (
          <tr key={index} className="border-t hover:bg-gray-50">
            <td className="p-4">{index + 1}</td>
            <td className="p-4">{bill.customerName}</td>
            <td className="p-4 font-mono">{bill.invoiceId}</td>
            <td className="p-4">{new Date(bill.date).toLocaleDateString('en-GB')}</td>
            <td className="p-4">₹{bill.total}</td>
            <td className="p-4">₹{bill.subTotal}</td>
            <td className="p-4">₹{bill.discount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProfitReportTable = ({ data }: { data: ProfitData[] }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-x-auto mt-4">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="p-4">S.No</th>
          <th className="p-4">Invoice ID</th>
          <th className="p-4">Date</th>
          <th className="p-4">Total Sale</th>
          <th className="p-4">Total Cost</th>
          <th className="p-4">Net Profit</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d, index) => (
          <tr key={index} className="border-t hover:bg-gray-50">
            <td className="p-4">{index + 1}</td>
            <td className="p-4 font-mono">{d.invoiceId}</td>
            <td className="p-4">{new Date(d.date).toLocaleDateString('en-GB')}</td>
            <td className="p-4">₹{d.totalSale}</td>
            <td className="p-4">₹{d.totalCost}</td>
            <td className="p-4">₹{d.netProfit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- SENIOR DEV FIX: Updated the Purchase Report Table component ---
const PurchaseReportTable = ({ data }: { data: PastPurchase[] }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-x-auto mt-4">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="p-4">S.No</th>
          <th className="p-4">Product ID</th>
          <th className="p-4">Product Name</th>
          <th className="p-4">Supplier Name</th>
          <th className="p-4">Date Created</th>
          <th className="p-4">Purchase Rate</th>
          <th className="p-4">GST (%)</th>
          <th className="p-4">Stock</th>
        </tr>
      </thead>
      <tbody>
        {data.map((purchase, index) => (
          <tr key={index} className="border-t hover:bg-gray-50">
            <td className="p-4">{index + 1}</td>
            <td className="p-4 font-mono">{purchase.productId}</td>
            <td className="p-4">{purchase.productName}</td>
            <td className="p-4">{purchase.supplierName}</td>
            <td className="p-4">{new Date(purchase.date).toLocaleDateString('en-GB')}</td>
            <td className="p-4">₹{purchase.purchaseRate}</td>
            <td className="p-4">{purchase.gst}%</td>
            <td className="p-4 font-bold">{purchase.stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Reports;