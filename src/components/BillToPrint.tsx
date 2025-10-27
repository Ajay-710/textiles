// src/components/BillToPrint.tsx

import React from 'react';

interface BillItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
}
interface BillProps {
  items: BillItem[];
  total: number;
  cashTendered: number;
  changeDue: number;
}

export const BillToPrint = React.forwardRef<HTMLDivElement, BillProps>((props, ref) => {
  const { items, total, cashTendered, changeDue } = props;
  const currentDate = new Date().toLocaleString();

  return (
    <div ref={ref} className="p-8 font-mono text-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold">T.Gopi Textiles</h1>
        <p>Main Market, Your City</p>
        <p>Date: {currentDate}</p>
        <p className="border-t border-b border-dashed border-black my-4 py-2 text-xl">
          INVOICE
        </p>
      </div>

      <table className="w-full text-left mt-4">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="py-1">{item.name}</td>
              <td className="py-1 text-center">{item.qty}</td>
              <td className="py-1 text-right">₹{item.price.toFixed(2)}</td>
              <td className="py-1 text-right">₹{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t-2 border-dashed border-black mt-6 pt-4 text-lg">
        <div className="flex justify-between font-semibold">
          <span>GRAND TOTAL:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cash Tendered:</span>
          <span>₹{cashTendered.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Change Due:</span>
          <span>₹{changeDue.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="font-semibold">Thank you for your purchase!</p>
        <p>Visit us again.</p>
      </div>
    </div>
  );
});