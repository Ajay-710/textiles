import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Pencil, Trash2, PlusCircle, X, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import { utils, writeFile } from 'xlsx';

interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  qty: number;
  gst: number;
  supplierId: string;
  supplierName: string;
}

const Products = () => {
  // --- THIS IS THE CORRECTED LINE ---
  const [products, setProducts] = useLocalStorage<Product[]>('products', [
    { id: 100002, barcode: "123456", name: "AJ FUNAFLUN", price: 219.00, qty: 18, gst: 5, supplierId: "S-001", supplierName: "Silk Weavers Inc." },
    { id: 100003, name: "AJ FOUR EVER", price: 349.00, qty: 8, gst: 5, supplierId: "S-002", supplierName: "Cotton Kings" },
  ]);
  // ------------------------------------
  
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

  const handleSaveProduct = (productToSave: Product) => {
    if (editingProduct && editingProduct.id) { // Check if we are editing
      setProducts(products.map(p => p.id === productToSave.id ? productToSave : p));
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 100001;
      setProducts([...products, { ...productToSave, id: newId }]);
    }
    handleCloseModal();
  };
  
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };
  
  const handleExportToExcel = () => {
    const worksheet = utils.json_to_sheet(products);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Products");
    writeFile(workbook, "T_Gopi_Textiles_Products.xlsx");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Product and Stock Management</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input 
          type="text" 
          placeholder="Search by Name or Barcode..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input w-1/3"
        />
        <div className="flex gap-4">
          <button onClick={handleExportToExcel} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2">
            <Download size={20} /> Export to Excel
          </button>
          <button onClick={() => handleOpenModal(null)} className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <PlusCircle size={20} /> Add New Product
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Barcode</th><th className="p-4">Name</th><th className="p-4">Price</th>
                <th className="p-4">Qty</th><th className="p-4">GST (%)</th><th className="p-4">Supplier</th><th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-mono">{product.barcode}</td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">₹{product.price.toFixed(2)}</td>
                  <td className="p-4">{product.qty}</td>
                  <td className="p-4">{product.gst}%</td>
                  <td className="p-4">{product.supplierName} ({product.supplierId})</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
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
    barcode: '', name: '', price: 0, qty: 0, gst: 0, supplierId: '', supplierName: ''
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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input" required />
            <div className="flex gap-2">
              <input type="text" placeholder="Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="form-input flex-grow" required />
              <button type="button" onClick={generateBarcode} className="px-4 py-2 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300 text-sm">Generate</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="form-input" required />
            <input type="number" placeholder="Quantity" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 0})} className="form-input" required />
            <input type="number" placeholder="GST (%)" value={formData.gst} onChange={e => setFormData({...formData, gst: parseFloat(e.target.value) || 0})} className="form-input" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Supplier ID (e.g., S-001)" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="form-input" required />
            <input type="text" placeholder="Supplier Name" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} className="form-input" required />
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

export default Products;