import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, X, Download, Layers } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { utils, writeFile } from 'xlsx';
import Barcode from 'react-barcode';

// API URL
const API_URL = 'https://product-service-821973944217.asia-southeast1.run.app/api';

// Data Structures
interface Product {
  id: string;
  name: string;
  category: string;
  purchaseRate: number;
  purchaseGst: number;
  price: number;
  discount: number;
  stockQuantity: number;
  vendorId: string;
  vendorName: string;
  barcode: string;
  barcodeImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Silk Saree', 'Kurti']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in.");
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true); setError(null);
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/products/all`, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      setError(error.message || "Could not load product data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { fetchProducts(); } 
      else { setIsLoading(false); setError("You are not logged in."); }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProduct = async (formData: any) => {
    const isEditing = !!formData.id;
    const method = isEditing ? 'PATCH' : 'POST';
    const endpoint = isEditing ? `${API_URL}/products/update/${formData.id}` : `${API_URL}/products/add`;
    
    const payload = {
      name: formData.name, category: formData.category,
      purchaseRate: parseFloat(formData.purchaseRate) || 0,
      purchaseGst: parseFloat(formData.purchaseGst) || 0,
      price: parseFloat(formData.price) || 0,
      discount: parseFloat(formData.discount) || 0,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
      vendorId: formData.vendorId, vendorName: formData.vendorName,
    };
    
    try {
      const headers = await getAuthHeader();
      const response = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server returned an error');
      }
      await fetchProducts();
      setProductModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save product:", error);
      alert(`Error saving product: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId: string | null) => {
    if (!productId) return alert("Cannot delete product with missing ID.");
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const headers = await getAuthHeader();
        await fetch(`${API_URL}/products/delete/${productId}`, { method: 'DELETE', headers });
        await fetchProducts();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Error deleting product.");
      }
    }
  };
  
  const handleOpenModal = (product: Product | null) => { setEditingProduct(product); setProductModalOpen(true); };
  const handleCloseModal = () => { setProductModalOpen(false); setEditingProduct(null); };

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
  
  const handleDownloadBarcode = (url: string, barcode: string) => {
    fetch(url).then(response => response.blob()).then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `barcode-${barcode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(() => alert('Could not download barcode image (CORS issue).'));
  };

  const filteredProducts = products.filter(p => {
    if (!p || !p.name) return false;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(lowerSearchTerm) || 
      (p.category && p.category.toLowerCase().includes(lowerSearchTerm)) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.id && p.id.toString().includes(searchTerm))
    );
  });
  
  if (isLoading) return <div className="p-6 text-center text-gray-500">Authenticating and loading product data...</div>;
  if (error) return <div className="p-6 text-red-600 font-semibold">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input type="text" placeholder="Search by Name, Category, ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-1/3" />
        <div className="flex gap-4">
          <button onClick={() => setCategoryModalOpen(true)} className="px-5 py-2.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 flex items-center gap-2"><Layers size={20} /> Manage Categories</button>
          <button onClick={() => handleOpenModal(null)} className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2"><PlusCircle size={20} /> Add New Product</button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Sl. No</th><th className="p-4">Product ID</th><th className="p-4">Product Name</th>
                <th className="p-4">Barcode</th><th className="p-4">Category</th><th className="p-4">Selling Price</th>
                <th className="p-4">Stock Qty</th><th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const uniqueKey = product.id || `temp-${index}`;
                return (
                  <tr key={uniqueKey} className="border-t hover:bg-gray-50">
                    <td className="p-4">{index + 1}</td><td className="p-4 font-mono">{product.id || 'N/A'}</td>
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{product.barcode}</span>
                        {product.barcodeImageUrl && (<button onClick={() => handleDownloadBarcode(product.barcodeImageUrl!, product.barcode)} title="Download Barcode Image" className="text-gray-400 hover:text-blue-600"><Download size={16} /></button>)}
                      </div>
                    </td>
                    <td className="p-4">{product.category}</td><td className="p-4">₹{(product.price || 0).toFixed(2)}</td>
                    <td className="p-4 font-bold">{product.stockQuantity}</td>
                    <td className="p-4"><div className="flex gap-3">
                      <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {isProductModalOpen && <ProductFormModal product={editingProduct} categories={categories} onSave={handleSaveProduct} onClose={handleCloseModal} />}
      {isCategoryModalOpen && <CategoryModal categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} onClose={() => setCategoryModalOpen(false)} />}
    </div>
  );
};

const ProductFormModal = ({ product, categories, onSave, onClose }: { product: Product | null, categories: string[], onSave: (p: any) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    id: product?.id || null, name: product?.name || '', category: product?.category || categories[0] || '',
    purchaseRate: product?.purchaseRate || 0, purchaseGst: product?.purchaseGst || 0,
    price: product?.price || 0, discount: product?.discount || 0, stockQuantity: product?.stockQuantity || 0,
    vendorId: product?.vendorId || '', vendorName: product?.vendorName || '', barcode: product?.barcode || '',
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h2><button onClick={onClose}><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Product Name</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="form-input mt-1" required /></div>
            <div><label>Category</label><select name="category" value={formData.category} onChange={handleChange} className="form-input mt-1" required>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Vendor Name</label><input name="vendorName" type="text" value={formData.vendorName} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Vendor ID</label><input name="vendorId" type="text" value={formData.vendorId} onChange={handleChange} className="form-input mt-1"/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label>Purchase Rate (₹)</label><input name="purchaseRate" type="number" value={formData.purchaseRate} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Selling Price (₹)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Stock Quantity</label><input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} className="form-input mt-1"/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label>Purchase GST (%)</label><input name="purchaseGst" type="number" value={formData.purchaseGst} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Discount (%)</label><input name="discount" type="number" value={formData.discount} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Barcode</label><input name="barcode" type="text" value={formData.barcode} onChange={handleChange} className="form-input mt-1"/></div>
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
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Manage Categories</h2><button onClick={onClose}><X/></button></div>
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