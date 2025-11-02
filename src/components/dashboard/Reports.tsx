import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { reportService } from '@/lib/api';
import { Download, ShoppingCart, TrendingUp, Truck } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// --- Data Structures ---
interface PastBill {
  invoiceId: string;
  date: string;
  items: any[];
  total: number;
  subTotal: number;
  discount: number;
  supplierName: string;
}
interface PastPurchase {
  purchaseId: string;
  date: string;
  items: any[];
  total: number;
  supplierName: string;
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
      if (activeTab === 'purchase') endpoint = '/reports/purchases';

      try {
        setIsLoading(true);
        setError(null);
        const response = await reportService.get(endpoint, {
          params: { startDate, endDate },
        });

        if (!Array.isArray(response.data)) {
          console.error('Invalid API response:', response.data);
          setError('Invalid response from server.');
          setFilteredData([]);
          return;
        }

        setFilteredData(response.data);
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.response?.data?.message || `Could not load ${activeTab} report.`);
        setFilteredData([]);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchReportData();
      else {
        setIsLoading(false);
        setError('You are not logged in.');
      }
    });

    return () => unsubscribe();
  }, [activeTab, startDate, endDate]);

  // --- Export to Excel ---
  const handleExportToExcel = () => {
    if (!filteredData || filteredData.length === 0) return alert('No data to export');
    const ws = utils.json_to_sheet(filteredData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, `${activeTab}_report`);
    writeFile(wb, `${activeTab}_report.xlsx`);
  };

  // --- Render Report Table ---
  const renderReportTable = () => {
    if (isLoading) return <div className="text-center py-10">Loading report...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

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

      {/* Date Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm flex items-end gap-4">
        <div>
          <label htmlFor="startDate">From Date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-input mt-1"
          />
        </div>
        <div>
          <label htmlFor="endDate">To Date</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-input mt-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-lg shadow-sm flex gap-2">
        <TabButton icon={ShoppingCart} label="Sales Report" isActive={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
        <TabButton icon={TrendingUp} label="Profit Report" isActive={activeTab === 'profit'} onClick={() => setActiveTab('profit')} />
        <TabButton icon={Truck} label="Purchase Report" isActive={activeTab === 'purchase'} onClick={() => setActiveTab('purchase')} />
      </div>

      {renderReportTable()}
    </div>
  );
};

// --- Tab Button ---
const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-2 ${
      isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

// --- Tables ---
const SalesReportTable = ({ data }: { data: PastBill[] }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-x-auto mt-4">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="p-4">S.No</th>
          <th className="p-4">Invoice ID</th>
          <th className="p-4">Date</th>
          <th className="p-4">Supplier Name</th>
          <th className="p-4">Total</th>
          <th className="p-4">Sub Total</th>
          <th className="p-4">Discount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((bill, index) => (
          <tr key={bill.invoiceId} className="border-t hover:bg-gray-50">
            <td className="p-4">{index + 1}</td>
            <td className="p-4 font-mono">{bill.invoiceId}</td>
            <td className="p-4">{new Date(bill.date).toLocaleDateString()}</td>
            <td className="p-4">{bill.supplierName}</td>
            <td className="p-4">₹{bill.total.toFixed(2)}</td>
            <td className="p-4">₹{bill.subTotal.toFixed(2)}</td>
            <td className="p-4">₹{bill.discount.toFixed(2)}</td>
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
          <tr key={d.invoiceId} className="border-t hover:bg-gray-50">
            <td className="p-4">{index + 1}</td>
            <td className="p-4 font-mono">{d.invoiceId}</td>
            <td className="p-4">{new Date(d.date).toLocaleDateString()}</td>
            <td className="p-4">₹{d.totalSale.toFixed(2)}</td>
            <td className="p-4">₹{d.totalCost.toFixed(2)}</td>
            <td className="p-4">₹{d.netProfit.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PurchaseReportTable = ({ data }: { data: PastPurchase[] }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-x-auto mt-4">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="p-4">S.No</th>
          <th className="p-4">Purchase ID</th>
          <th className="p-4">Date</th>
          <th className="p-4">Supplier Name</th>
          <th className="p-4">Total</th>
        </tr>
      </thead>
      <tbody>
        {data.map((purchase, index) => (
          <tr key={purchase.purchaseId} className="border-t hover:bg-gray-50">
            <td className="p-4">{index + 1}</td>
            <td className="p-4 font-mono">{purchase.purchaseId}</td>
            <td className="p-4">{new Date(purchase.date).toLocaleDateString()}</td>
            <td className="p-4">{purchase.supplierName}</td>
            <td className="p-4">₹{purchase.total.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Reports;
