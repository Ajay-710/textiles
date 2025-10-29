import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage'; 
import { Pencil, Trash2, PlusCircle, X, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import { utils, writeFile } from 'xlsx';

// Data Structures
interface Product {
  id: number;
  dateAdded: string;
  supplierName: string;
  supplierId: string;
  name: string;
  barcode: string;
  purchaseRate: number;
  price: number;
  qty: number;
  gst: number;
}

const initialProducts: Product[] = [
  { id: 100002, dateAdded: new Date().toLocaleDateString(), supplierName: "Silk Weavers Inc.", supplierId: "S-001", name: "AJ FUNAFLUN", barcode: "123456", purchaseRate: 150.00, price: 219.00, qty: 18, gst: 5 },
  { id: 100003, dateAdded: new Date().toLocaleDateString(), supplierName: "Cotton Kings", supplierId: "S-002", name: "AJ FOUR EVER", barcode: "123457", purchaseRate: 250.00, price: 349.00, qty: 8, gst: 5 },
];

const Products = () => {
  // We are using useState for now to ensure stability.
  const [products, setProducts] = useState<Product[]>(initialProducts);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (productToSave: Omit<Product, 'id'> & { id?: number }) => {
    if (productToSave.id) {
      setProducts(products.map(p => p.id === productToSave.id ? (productToSave as Product) : p));
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 100001;
      setProducts([...products, { ...(productToSave as Omit<Product, 'id'>), id: newId }]);
    }
    handleCloseModal();
  };
  
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };
  
  const handleExportToExcel = () => {
    const dataToExport = products.map((p, index) => ({
      "Sl. No": index + 1, "Date Added": p.dateAdded, "Product ID": p.id, "Product Name": p.name,
      "Barcode": p.barcode, "Supplier ID": p.supplierId, "Supplier Name": p.supplierName,
      "Purchase Rate": p.purchaseRate, "Selling Price": p.price, "Quantity": p.qty, "GST %": p.gst,
    }));
    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Products");
    writeFile(workbook, "Stock_Details.xlsx");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm) ||
    p.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input type="text" placeholder="Search by Name, Barcode, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-1/3" />
        <div className="flex gap-4">
          <button onClick={handleExportToExcel} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2"><Download size={20} /> Export to Excel</button>
          <button onClick={() => handleOpenModal(null)} className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2"><PlusCircle size={20} /> Add New Product</button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Sl. No</th><th className="p-4">Date</th><th className="p-4">Product ID</th><th className="p-4">Product Name</th>
                <th className="p-4">Supplier</th><th className="p-4">Purchase Rate</th><th className="p-4">Selling Price</th>
                <th className="p-4">Qty</th><th className="p-4">GST %</th><th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{index + 1}</td><td className="p-4">{product.dateAdded}</td>
                  <td className="p-4 font-mono">{product.id}</td><td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">{product.supplierName} ({product.supplierId})</td>
                  <td className="p-4">₹{product.purchaseRate.toFixed(2)}</td><td className="p-4">₹{product.price.toFixed(2)}</td>
                  <td className="p-4 font-bold">{product.qty}</td><td className="p-4">{product.gst}%</td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:red-800"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && <ProductFormModal product={editingProduct} onSave={handleSaveProduct} onClose={handleCloseModal} />}
    </div>
  );
};

const ProductFormModal = ({ product, onSave, onClose }: { product: Product | null, onSave: (p: Omit<Product, 'id'> & { id?: number }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState(product || {
    dateAdded: new Date().toLocaleDateString(), supplierName: '', supplierId: '', name: '', barcode: '',
    purchaseRate: 0, price: 0, qty: 0, gst: 0,
  });

  const generateBarcode = () => {
    const random6Digits = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({ ...formData, barcode: random6Digits });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: product?.id });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Product Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input mt-1" required /></div>
            <div><label>Barcode (6-digit)</label><div className="flex gap-2 mt-1"><input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="form-input flex-grow" required /><button type="button" onClick={generateBarcode} className="px-4 py-2 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300 text-sm">Generate</button></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Supplier Name</label><input type="text" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} className="form-input mt-1" required /></div>
            <div><label>Supplier ID (e.g., S-001)</label><input type="text" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="form-input mt-1" required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label>Purchase Rate (₹)</label><input type="number" value={formData.purchaseRate} onChange={e => setFormData({...formData, purchaseRate: parseFloat(e.target.value) || 0})} className="form-input mt-1" required /></div>
            <div><label>Selling Price / MRP (₹)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="form-input mt-1" required /></div>
            <div><label>Quantity</label><input type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 0})} className="form-input mt-1" required /></div>
            <div><label>GST (%)</label><input type="number" value={formData.gst} onChange={e => setFormData({...formData, gst: parseFloat(e.target.value) || 0})} className="form-input mt-1" /></div>
          </div>
          {formData.barcode && <div className="p-4 bg-gray-50 rounded-md flex justify-center"><Barcode value={formData.barcode} height={50} /></div>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- THIS IS THE CRUCIAL LINE THAT WAS MISSING ---
export default Products;