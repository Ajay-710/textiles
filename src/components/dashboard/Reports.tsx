import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Download, BarChart2, Calendar, FileText, TrendingUp, Percent, ShoppingCart, Truck } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// Data Structures
interface BillItem { id: number; name: string; billQty: number; price: number; purchaseRate: number; discount: number; subtotal: number; gst: number; }
interface PastBill { invoiceId: string; date: string; items: BillItem[]; total: number; subTotal: number; discount: number; }
interface PastPurchase { purchaseId: string; date: string; items: any[]; total: number; supplierName: string; }

type ReportTab = 'sales' | 'profit' | 'purchase';

const Reports = () => {
  const [pastBills] = useLocalStorage<PastBill[]>('pastBills', []);
  const [pastPurchases] = useLocalStorage<PastPurchase[]>('pastPurchases', []);
  
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    numberOfInvoices: 0,
    totalProfit: 0,
    profitMargin: 0,
  });

  const handleFilter = () => {
    const sourceData = (activeTab === 'purchase') ? pastPurchases : pastBills;
    if (!startDate || !endDate) {
      setFilteredData(sourceData);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = sourceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    let revenue = 0, totalCost = 0;
    const dataForKpi = (startDate && endDate) ? (filteredData as PastBill[]) : pastBills;
    
    for (const bill of dataForKpi) {
      if (bill && bill.total && bill.items) {
        revenue += bill.total;
        totalCost += bill.items.reduce((sum, item) => sum + (item.billQty * item.purchaseRate), 0);
      }
    }
    
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    setKpis({
      totalRevenue: revenue,
      numberOfInvoices: dataForKpi.length,
      totalProfit: profit,
      profitMargin: margin,
    });
  }, [filteredData, pastBills, startDate, endDate]);

  useEffect(() => {
    handleFilter();
  }, [activeTab, pastBills, pastPurchases]);
  
  // --- THIS IS THE FULL, WORKING EXPORT FUNCTION ---
  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      alert("No data to export for the current view.");
      return;
    }
    
    let dataToExport, sheetName, fileName;

    switch (activeTab) {
      case 'profit':
        sheetName = 'Profit_Report';
        fileName = 'Profit_Report.xlsx';
        dataToExport = filteredData.map((bill: PastBill) => {
          const totalCost = bill.items.reduce((sum, item) => sum + (item.billQty * item.purchaseRate), 0);
          const profit = bill.total - totalCost;
          return { 
            'Invoice ID': bill.invoiceId, 
            'Date': bill.date, 
            'Total Sale': bill.total, 
            'Total Cost': totalCost, 
            'Net Profit': profit 
          };
        });
        break;

      case 'purchase':
        sheetName = 'Purchase_Report';
        fileName = 'Purchase_Report.xlsx';
        dataToExport = filteredData.map((purchase: PastPurchase) => ({
          'Purchase ID': purchase.purchaseId, 
          'Date': purchase.date, 
          'Supplier': purchase.supplierName, 
          'Total Amount': purchase.total
        }));
        break;

      default: // 'sales'
        sheetName = 'Sales_Report';
        fileName = 'Sales_Report.xlsx';
        dataToExport = filteredData.map((bill: PastBill) => ({
          'Invoice ID': bill.invoiceId, 
          'Date': bill.date, 
          'Sub Total': bill.subTotal, 
          'Discount': bill.discount, 
          'Grand Total': bill.total
        }));
        break;
    }

    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, sheetName);
    writeFile(workbook, fileName);
  };
  // ---------------------------------------------------

  const renderReportTable = () => {
    switch (activeTab) {
      case 'profit': return <ProfitReportTable bills={filteredData as PastBill[]} />;
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
        <div><label htmlFor="startDate" className="text-sm font-medium text-gray-600">From Date</label><input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input mt-1" /></div>
        <div><label htmlFor="endDate" className="text-sm font-medium text-gray-600">To Date</label><input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input mt-1" /></div>
        <button onClick={handleFilter} className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Filter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={BarChart2} title="Total Revenue" value={`₹${kpis.totalRevenue.toFixed(2)}`} color="text-green-500" />
        <KpiCard icon={FileText} title="Number of Invoices" value={kpis.numberOfInvoices} color="text-blue-500" />
        <KpiCard icon={TrendingUp} title="Total Profit" value={`₹${kpis.totalProfit.toFixed(2)}`} color="text-indigo-500" />
        <KpiCard icon={Percent} title="Profit Margin" value={`${kpis.profitMargin.toFixed(2)}%`} color="text-orange-500" />
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
const KpiCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => ( <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4 border border-gray-200"><div className={`p-3 rounded-full bg-gray-100 ${color}`}><Icon size={24} /></div><div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div></div> );
const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => ( <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-semibold transition-colors ${isActive ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Icon size={18} /> {label}</button> );
const SalesReportTable = ({ bills }: { bills: PastBill[] }) => ( <div className="bg-white rounded-lg shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-4">Invoice ID</th><th className="p-4">Date & Time</th><th className="p-4">Sub Total</th><th className="p-4">Discount</th><th className="p-4">Grand Total</th></tr></thead><tbody>{bills.length === 0 ? (<tr><td colSpan={5} className="text-center text-gray-500 py-10">No sales data found.</td></tr>) : bills.map(bill => (<tr key={bill.invoiceId} className="border-t hover:bg-gray-50"><td className="p-4 font-medium">{bill.invoiceId}</td><td className="p-4">{bill.date}</td><td className="p-4">₹{bill.subTotal.toFixed(2)}</td><td className="p-4 text-red-600">₹{bill.discount.toFixed(2)}</td><td className="p-4 font-bold">₹{bill.total.toFixed(2)}</td></tr>))}</tbody></table></div> );
const ProfitReportTable = ({ bills }: { bills: PastBill[] }) => ( <div className="bg-white rounded-lg shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-4">Invoice ID</th><th className="p-4">Date & Time</th><th className="p-4">Total Sale</th><th className="p-4">Total Cost</th><th className="p-4">Net Profit</th></tr></thead><tbody>{bills.length === 0 ? (<tr><td colSpan={5} className="text-center text-gray-500 py-10">No sales data to calculate profit.</td></tr>) : bills.map(bill => { const totalCost = bill.items.reduce((sum, item) => sum + (item.billQty * item.purchaseRate), 0); const profit = bill.total - totalCost; return (<tr key={bill.invoiceId} className="border-t hover:bg-gray-50"><td className="p-4 font-medium">{bill.invoiceId}</td><td className="p-4">{bill.date}</td><td className="p-4">₹{bill.total.toFixed(2)}</td><td className="p-4 text-red-600">₹{totalCost.toFixed(2)}</td><td className={`p-4 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{profit.toFixed(2)}</td></tr>); })}</tbody></table></div> );
const PurchaseReportTable = ({ purchases }: { purchases: PastPurchase[] }) => ( <div className="bg-white rounded-lg shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-4">Purchase ID</th><th className="p-4">Date & Time</th><th className="p-4">Supplier</th><th className="p-4">Total Amount</th></tr></thead><tbody>{purchases.length === 0 ? (<tr><td colSpan={4} className="text-center text-gray-500 py-10">No purchase data found.</td></tr>) : purchases.map(p => (<tr key={p.purchaseId} className="border-t hover:bg-gray-50"><td className="p-4 font-medium">{p.purchaseId}</td><td className="p-4">{p.date}</td><td className="p-4">{p.supplierName}</td><td className="p-4 font-bold">₹{p.total.toFixed(2)}</td></tr>))}</tbody></table></div> );

export default Reports;