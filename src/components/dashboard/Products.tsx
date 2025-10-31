import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Pencil, Trash2, PlusCircle, X, Download, Layers } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

// Data Structures
interface Product {
  id: number;
  dateAdded: string;
  supplierName: string;
  supplierId: string;
  name: string;
  category: string;
  purchaseRate: number;
  price: number;
  qty: number;
  gst: number;
  barcode: string; // Keep for type consistency even if not used in form
}

const Products = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', [
    { id: 1001, dateAdded: new Date().toLocaleDateString(), supplierName: "Kanchi Weavers", supplierId: "S-001", name: "Kanchipuram Silk Saree", category: "Silk Saree", purchaseRate: 1800, price: 2499, qty: 30, gst: 12, barcode: "300101" },
    { id: 1003, dateAdded: new Date().toLocaleDateString(), supplierName: "Jaipur Prints", supplierId: "S-003", name: "Printed Cotton Kurti", category: "Kurti", purchaseRate: 550, price: 799, qty: 100, gst: 5, barcode: "400201" },
  ]);
  const [categories, setCategories] = useLocalStorage<string[]>('productCategories', ['Silk Saree', 'Kurti', 'Gown', 'Dress Material']);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenProductModal = (product: Product | null) => { setEditingProduct(product); setProductModalOpen(true); };
  const handleCloseProductModal = () => { setProductModalOpen(false); setEditingProduct(null); };

  const handleSaveProduct = (productToSave: Omit<Product, 'id'> & { id?: number }) => {
    if (productToSave.id) {
      setProducts(products.map(p => p.id === productToSave.id ? (productToSave as Product) : p));
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1001;
      setProducts([...products, { ...(productToSave as Omit<Product, 'id'>), id: newId }]);
    }
    handleCloseProductModal();
  };
  
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleAddCategory = (newCategory: string) => {
    if (newCategory && !categories.find(c => c.toLowerCase() === newCategory.toLowerCase())) {
      setCategories([...categories, newCategory]);
    } else {
      alert(`Category "${newCategory}" already exists.`);
    }
  };
  const handleDeleteCategory = (categoryToDelete: string) => {
    if (window.confirm(`Delete category "${categoryToDelete}"?`)) {
      setCategories(categories.filter(c => c !== categoryToDelete));
    }
  };
  
  const handleExportToExcel = () => {
    const dataToExport = products.map((p, index) => ({
      "Sl. No": index + 1, "Date Added": p.dateAdded, "Product ID": p.id, "Product Name": p.name,
      "Category": p.category, "Supplier ID": p.supplierId, "Supplier Name": p.supplierName,
      "Purchase Rate": p.purchaseRate, "Selling Price": p.price, "Quantity": p.qty, "GST %": p.gst,
      "Net Profit": (p.price - p.purchaseRate) * p.qty,
    }));
    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Products");
    writeFile(workbook, "Stock_Details_with_Profit.xlsx");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input 
          type="text" 
          placeholder="Search by Name, Category, or ID..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input w-1/3"
        />
        <div className="flex gap-4">
          <button onClick={handleExportToExcel} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2"><Download size={20} /> Export</button>
          <button onClick={() => setCategoryModalOpen(true)} className="px-5 py-2.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 flex items-center gap-2">
            <Layers size={20} /> Manage Categories
          </button>
          <button onClick={() => handleOpenProductModal(null)} className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <PlusCircle size={20} /> Add New Product
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Sl. No</th><th className="p-4">Product Name</th>
                <th className="p-4">Purchase Rate</th><th className="p-4">Selling Price</th>
                <th className="p-4">Qty</th><th className="p-4">Net Profit</th><th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const netProfit = (product.price - product.purchaseRate) * product.qty;
                return (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{index + 1}</td><td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4 text-red-600">₹{(product.purchaseRate || 0).toFixed(2)}</td><td className="p-4 text-green-600">₹{(product.price || 0).toFixed(2)}</td>
                    <td className="p-4 font-bold">{product.qty}</td>
                    <td className={`p-4 font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>₹{netProfit.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleOpenProductModal(product)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {isProductModalOpen && <ProductFormModal product={editingProduct} categories={categories} onSave={handleSaveProduct} onClose={handleCloseProductModal} />}
      {isCategoryModalOpen && <CategoryModal categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} onClose={() => setCategoryModalOpen(false)} />}
    </div>
  );
};

// --- THIS IS THE FULL, CORRECT CODE FOR THE MODALS ---
const ProductFormModal = ({ product, categories, onSave, onClose }: { product: Product | null, categories: string[], onSave: (p: Omit<Product, 'id'> & { id?: number }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState(product || {
    dateAdded: new Date().toLocaleDateString(),
    supplierName: '',
    supplierId: '',
    name: '',
    category: categories[0] || '',
    purchaseRate: 0,
    price: 0,
    qty: 0,
    gst: 0,
    barcode: ''
  });
  
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
            <div>
              <label>Product Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input mt-1" required />
            </div>
            <div>
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="form-input mt-1" required>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Supplier Name</label><input type="text" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} className="form-input mt-1" required /></div>
            <div><label>Supplier ID</label><input type="text" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="form-input mt-1" required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label>Purchase Rate (₹)</label><input type="number" value={formData.purchaseRate} onChange={e => setFormData({...formData, purchaseRate: parseFloat(e.target.value) || 0})} className="form-input mt-1" required /></div>
            <div><label>Selling Price / MRP (₹)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="form-input mt-1" required /></div>
            <div><label>Quantity</label><input type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 0})} className="form-input mt-1" required /></div>
            <div><label>GST (%)</label><input type="number" value={formData.gst} onChange={e => setFormData({...formData, gst: parseFloat(e.target.value) || 0})} className="form-input mt-1" /></div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryModal = ({ categories, onAdd, onDelete, onClose }: { categories: string[], onAdd: (cat: string) => void, onDelete: (cat: string) => void, onClose: () => void }) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    onAdd(newCategory.trim());
    setNewCategory('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Categories</h2>
          <button onClick={onClose}><X/></button>
        </div>
        <div className="space-y-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input type="text" placeholder="New category name..." value={newCategory} onChange={e => setNewCategory(e.target.value)} className="form-input flex-grow" />
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md">Add</button>
          </form>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Existing Categories:</h3>
            <ul className="max-h-60 overflow-y-auto space-y-2">
              {categories.map(cat => (
                <li key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span>{cat}</span>
                  <button onClick={() => onDelete(cat)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;