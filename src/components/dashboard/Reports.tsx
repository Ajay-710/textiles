import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { reportService } from '@/lib/api';
import { Download, BarChart2, Calendar, FileText, TrendingUp, Percent, ShoppingCart, Truck } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// Data Structures
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

  useEffect(() => {
    const fetchReportData = async () => {
      let endpoint = '/sales';
      if (activeTab === 'profit') endpoint = '/profit';
      if (activeTab === 'purchase') endpoint = '/purchase';
      
      try {
        setIsLoading(true); setError(null);
        const response = await reportService.get(endpoint, {
          params: { startDate, endDate }
        });
        setFilteredData(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || `Could not load ${activeTab} report.`);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { fetchReportData(); } 
      else { setIsLoading(false); setError("You are not logged in."); }
    });
    return () => unsubscribe();
  }, [activeTab, startDate, endDate]);
  
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

const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => ( <button onClick={onClick} className={`flex-1 ...`}>{/* ... */}</button> );
const SalesReportTable = ({ bills }: { bills: PastBill[] }) => ( <div className="bg-white ...">{/* ... */}</div> );
const ProfitReportTable = ({ bills }: { bills: ProfitData[] }) => ( <div className="bg-white ...">{/* ... */}</div> );
const PurchaseReportTable = ({ purchases }: { purchases: PastPurchase[] }) => ( <div className="bg-white ...">{/* ... */}</div> );

export default Reports;