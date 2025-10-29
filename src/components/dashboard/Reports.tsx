import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Download, BarChart2, Calendar, FileText, ShoppingBag, Tag, Percent, TrendingUp } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// --- Data Structures ---
// Ensure gst and purchaseRate are part of the BillItem definition
interface BillItem { id: number; name: string; billQty: number; price: number; purchaseRate: number; discount: number; subtotal: number; gst: number; }
interface PastBill { invoiceId: string; date: string; items: BillItem[]; total: number; subTotal: number; discount: number; }

const Reports = () => {
  const [pastBills] = useLocalStorage<PastBill[]>('pastBills', []);
  
  const [filteredBills, setFilteredBills] = useState<PastBill[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalSales: 0, // This is the number of invoices
    totalProfit: 0,
    profitMargin: 0,
  });

  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFilteredBills(pastBills);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = pastBills.filter(bill => {
      const billDate = new Date(bill.date);
      return billDate >= start && billDate <= end;
    });
    setFilteredBills(filtered);
  };

  useEffect(() => {
    let revenue = 0;
    let totalCost = 0;
    
    for (const bill of filteredBills) {
      revenue += bill.total;
      // Calculate total cost of goods sold for this bill
      totalCost += bill.items.reduce((sum, item) => sum + (item.billQty * item.purchaseRate), 0);
    }
    
    const profit = revenue - totalCost;
    // Calculate profit margin, avoiding division by zero
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    setKpis({
      totalRevenue: revenue,
      totalSales: filteredBills.length,
      totalProfit: profit,
      profitMargin: margin,
    });
  }, [filteredBills]);

  useEffect(() => {
    setFilteredBills(pastBills);
  }, [pastBills]);
  
  const handleExportToExcel = () => {
    if (filteredBills.length === 0) return alert("No data to export.");
    const dataToExport = filteredBills.map(bill => {
      const totalCost = bill.items.reduce((sum, item) => sum + (item.billQty * item.purchaseRate), 0);
      const profit = bill.total - totalCost;
      return {
        'Invoice ID': bill.invoiceId,
        'Date': bill.date,
        'Items Sold': bill.items.reduce((sum, item) => sum + item.billQty, 0),
        'Sub Total': bill.subTotal.toFixed(2),
        'Discount': bill.discount.toFixed(2),
        'Grand Total': bill.total.toFixed(2),
        'Profit': profit.toFixed(2), // Add Profit to export
      };
    });
    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sales Report");
    writeFile(workbook, "Sales_Profit_Report.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Sales & Profit Reports</h1>
        <button onClick={handleExportToExcel} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2">
          <Download size={18} /> Export to Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm flex items-end gap-4">
        <div><label htmlFor="startDate" className="text-sm font-medium text-gray-600">From Date</label><input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input mt-1" /></div>
        <div><label htmlFor="endDate" className="text-sm font-medium text-gray-600">To Date</label><input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input mt-1" /></div>
        <button onClick={handleFilter} className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Filter</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={BarChart2} title="Total Revenue" value={`₹${kpis.totalRevenue.toFixed(2)}`} color="text-green-500" />
        <KpiCard icon={FileText} title="Number of Invoices" value={kpis.totalSales} color="text-blue-500" />
        <KpiCard icon={TrendingUp} title="Total Profit" value={`₹${kpis.totalProfit.toFixed(2)}`} color="text-indigo-500" />
        <KpiCard icon={Percent} title="Profit Margin" value={`${kpis.profitMargin.toFixed(2)}%`} color="text-orange-500" />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Invoice ID</th><th className="p-4">Date</th>
                <th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 && (<tr><td colSpan={5} className="text-center text-gray-500 py-10">No sales data found.</td></tr>)}
              {filteredBills.map(bill => {
                const totalCost = bill.items.reduce((sum, item) => sum + (item.billQty * item.purchaseRate), 0);
                const profit = bill.total - totalCost;
                return (
                  <tr key={bill.invoiceId} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{bill.invoiceId}</td>
                    <td className="p-4 text-gray-600">{bill.date}</td>
                    <td className="p-4 text-gray-600">{bill.items.reduce((sum, item) => sum + item.billQty, 0)}</td>
                    <td className="p-4 font-bold text-gray-900">₹{bill.total.toFixed(2)}</td>
                    <td className={`p-4 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{profit.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-full bg-gray-100 ${color}`}><Icon size={24} /></div>
    <div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
  </div>
);

export default Reports;