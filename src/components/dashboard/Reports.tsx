import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Download, BarChart2, Calendar, FileText, TrendingUp, Percent, ShoppingCart, Truck } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// --- THIS IS THE CORRECT API URL ---
const API_URL = 'https://report-service-821973944217.asia-southeast1.run.app';

// --- Data Structures ---
// These should match the data structure returned by your reports API
interface PastBill { invoiceId: string; date: string; items: any[]; total: number; subTotal: number; discount: number; }
interface PastPurchase { purchaseId: string; date: string; items: any[]; total: number; supplierName: string; }
interface ProfitData { invoiceId: string; date: string; totalSale: number; totalCost: number; netProfit: number; }

type ReportTab = 'sales' | 'profit' | 'purchase';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in.");
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };
  
  // This effect fetches the correct data whenever the tab or date range changes
  useEffect(() => {
    const fetchReportData = async () => {
      let endpoint = '';
      switch (activeTab) {
        case 'profit': endpoint = '/reports/profit'; break;
        case 'purchase': endpoint = '/reports/purchase'; break;
        default: endpoint = '/reports/sales'; break;
      }
      
      // Add date range query parameters if they exist
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      const queryString = queryParams.toString();
      
      try {
        setIsLoading(true); setError(null);
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`, { headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setFilteredData(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error(`Failed to fetch ${activeTab} report:`, err);
        setError(err.message || `Could not load ${activeTab} report.`);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { fetchReportData(); } 
      else { setIsLoading(false); setError("You are not logged in."); }
    });
    return () => unsubscribe();
  }, [activeTab, startDate, endDate]); // Re-fetch when tab or dates change

  const handleExportToExcel = () => { /* ... Unchanged ... */ };

  const renderReportTable = () => {
    if (isLoading) return <div className="text-center py-10">Loading report...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

    switch (activeTab) {
      case 'profit': return <ProfitReportTable bills={filteredData as ProfitData[]} />;
      case 'purchase': return <PurchaseReportTable purchases={filteredData as PastPurchase[]} />;
      default: return <SalesReportTable bills={filteredData as PastBill[]} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Reports Dashboard</h1>
        <button onClick={handleExportToExcel} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2">
          <Download size={18} /> Export Current View
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm flex items-end gap-4">
        <div><label htmlFor="startDate">From Date</label><input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input mt-1" /></div>
        <div><label htmlFor="endDate">To Date</label><input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input mt-1" /></div>
        {/* The filter now happens automatically when dates change */}
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

// --- Helper Components ---
const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => ( <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-semibold transition-colors ${isActive ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Icon size={18} /> {label}</button> );
const SalesReportTable = ({ bills }: { bills: PastBill[] }) => ( <div className="bg-white rounded-lg shadow-sm overflow-hidden"><table className="w-full text-left">...</table></div> );
const ProfitReportTable = ({ bills }: { bills: ProfitData[] }) => ( <div className="bg-white rounded-lg shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b"><tr>
  <th className="p-4">Invoice ID</th><th className="p-4">Date & Time</th><th className="p-4">Total Sale</th><th className="p-4">Total Cost</th><th className="p-4">Net Profit</th>
</tr></thead><tbody>
  {bills.length === 0 ? (<tr><td colSpan={5} className="text-center text-gray-500 py-10">No profit data found.</td></tr>) : bills.map(bill => (
    <tr key={bill.invoiceId} className="border-t hover:bg-gray-50">
      <td className="p-4 font-medium">{bill.invoiceId}</td><td className="p-4">{new Date(bill.date).toLocaleString()}</td><td className="p-4">₹{bill.totalSale.toFixed(2)}</td>
      <td className="p-4 text-red-600">₹{bill.totalCost.toFixed(2)}</td><td className={`p-4 font-bold ${bill.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{bill.netProfit.toFixed(2)}</td>
    </tr>
  ))}
</tbody></table></div> );
const PurchaseReportTable = ({ purchases }: { purchases: PastPurchase[] }) => ( <div className="bg-white rounded-lg shadow-sm overflow-hidden"><table className="w-full text-left">...</table></div> );

export default Reports;