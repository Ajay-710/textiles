import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Download, BarChart2, Calendar, FileText, ShoppingBag, Tag } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// --- Data Structures (ensure this matches what you save in Billing.tsx) ---
interface BillItem { id: number; name: string; billQty: number; price: number; discount: number; subtotal: number; }
interface PastBill { invoiceId: string; date: string; items: BillItem[]; total: number; subTotal: number; discount: number; }

const Reports = () => {
  const [pastBills] = useLocalStorage<PastBill[]>('pastBills', []);
  
  // State for filtering
  const [filteredBills, setFilteredBills] = useState<PastBill[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for calculated Key Performance Indicators (KPIs)
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalItemsSold: 0,
    totalDiscount: 0,
  });

  // Function to filter bills based on the date range
  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFilteredBills(pastBills); // If dates are empty, show all bills
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    const filtered = pastBills.filter(bill => {
      // We need to parse the date string from localStorage
      // This assumes a format like "MM/DD/YYYY, HH:MM:SS AM/PM"
      const billDate = new Date(bill.date);
      return billDate >= start && billDate <= end;
    });
    setFilteredBills(filtered);
  };

  // Effect to calculate KPIs whenever the filtered bills change
  useEffect(() => {
    let revenue = 0;
    let items = 0;
    let discount = 0;
    
    for (const bill of filteredBills) {
      revenue += bill.total;
      discount += bill.discount;
      items += bill.items.reduce((sum, item) => sum + item.billQty, 0);
    }
    
    setKpis({
      totalRevenue: revenue,
      totalSales: filteredBills.length,
      totalItemsSold: items,
      totalDiscount: discount,
    });
  }, [filteredBills]);

  // Effect to run the filter on initial component load
  useEffect(() => {
    setFilteredBills(pastBills);
  }, [pastBills]);
  
  // Function to export the current filtered data to Excel
  const handleExportToExcel = () => {
    if (filteredBills.length === 0) {
      alert("No data to export.");
      return;
    }
    const dataToExport = filteredBills.map(bill => ({
      'Invoice ID': bill.invoiceId,
      'Date': bill.date,
      'Items Sold': bill.items.reduce((sum, item) => sum + item.billQty, 0),
      'Sub Total': bill.subTotal,
      'Discount': bill.discount,
      'Grand Total': bill.total,
    }));
    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sales Report");
    writeFile(workbook, "Sales_Report.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Sales Reports</h1>
        <button onClick={handleExportToExcel} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2">
          <Download size={18} /> Export to Excel
        </button>
      </div>

      {/* --- Date Filter Card --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm flex items-end gap-4">
        <div>
          <label htmlFor="startDate" className="text-sm font-medium text-gray-600">From Date</label>
          <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input mt-1" />
        </div>
        <div>
          <label htmlFor="endDate" className="text-sm font-medium text-gray-600">To Date</label>
          <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input mt-1" />
        </div>
        <button onClick={handleFilter} className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Filter</button>
      </div>
      
      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={BarChart2} title="Total Revenue" value={`₹${kpis.totalRevenue.toFixed(2)}`} color="text-green-500" />
        <KpiCard icon={FileText} title="Total Sales" value={kpis.totalSales} color="text-blue-500" />
        <KpiCard icon={ShoppingBag} title="Items Sold" value={kpis.totalItemsSold} color="text-yellow-500" />
        <KpiCard icon={Tag} title="Total Discount" value={`₹${kpis.totalDiscount.toFixed(2)}`} color="text-red-500" />
      </div>

      {/* --- Detailed Sales Report Table --- */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Invoice ID</th><th className="p-4">Date</th>
                <th className="p-4">Items</th><th className="p-4">Sub Total</th>
                <th className="p-4">Discount</th><th className="p-4">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-10">No sales data found for the selected period.</td></tr>
              )}
              {filteredBills.map(bill => (
                <tr key={bill.invoiceId} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{bill.invoiceId}</td>
                  <td className="p-4 text-gray-600">{bill.date}</td>
                  <td className="p-4 text-gray-600">{bill.items.reduce((sum, item) => sum + item.billQty, 0)}</td>
                  <td className="p-4 text-gray-600">₹{bill.subTotal.toFixed(2)}</td>
                  <td className="p-4 text-red-600">₹{bill.discount.toFixed(2)}</td>
                  <td className="p-4 font-bold text-gray-900">₹{bill.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Helper Component for the KPI Cards ---
const KpiCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default Reports;