import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, X, Download, Layers } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { productService, vendorService } from '@/lib/api';
import { utils, writeFile } from 'xlsx';

// Data Structures
interface Product {
  id: string; name: string; category: string; purchaseRate: number; purchaseGst: number;
  price: number; discount: number; stockQuantity: number; vendorId: string; vendorName: string;
  createdAt: string; updatedAt: string;
}
interface Vendor { id: string; name: string; }

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<string[]>(['Silk Saree', 'Kurti']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true); setError(null);
      const [productsRes, vendorsRes] = await Promise.all([
        productService.get('/products/all'),
        vendorService.get('/vendors/all')
      ]);
      setProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Could not load data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { fetchData(); } 
      else { setIsLoading(false); setError("You are not logged in."); }
    });
    return () => unsubscribe();
  }, []);
  
  const handleSaveProduct = async (formData: any) => {
    const isEditing = !!formData.id;
    const method = isEditing ? 'patch' : 'post';
    const endpoint = isEditing ? `/products/${formData.id}` : `/products/add`;
    try {
      await productService[method](endpoint, formData);
      await fetchData(); // Refresh data
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving product: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure?")) {
      try {
        await productService.delete(`/products/${productId}`);
        await fetchData(); // Refresh data
      } catch (err: any) {
        alert(`Error deleting product: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleAddCategory = (newCategory: string) => { /* ... Logic from previous answer ... */ };
  const handleDeleteCategory = (categoryToDelete: string) => { /* ... Logic from previous answer ... */ };
  
  const handleOpenModal = (product: Product | null) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 font-semibold">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input type="text" placeholder="Search by Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-1/3" />
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
                <th className="p-4">Sl. No</th><th className="p-4">Product Name</th><th className="p-4">Category</th>
                <th className="p-4">Purchase Rate</th><th className="p-4">Selling Price</th><th className="p-4">Stock Qty</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{index + 1}</td><td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">{product.category}</td><td className="p-4">₹{(product.purchaseRate || 0).toFixed(2)}</td>
                  <td className="p-4">₹{(product.price || 0).toFixed(2)}</td><td className="p-4 font-bold">{product.stockQuantity}</td>
                  <td className="p-4"><div className="flex gap-3">
                    <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && <ProductFormModal product={editingProduct} categories={categories} vendors={vendors} onSave={handleSaveProduct} onClose={handleCloseModal} />}
      {isCategoryModalOpen && <CategoryModal categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} onClose={() => setCategoryModalOpen(false)} />}
    </div>
  );
};

const ProductFormModal = ({ product, categories, vendors, onSave, onClose }: { product: Product | null, categories: string[], vendors: Vendor[], onSave: (p: any) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    id: product?.id || null, name: product?.name || '', category: product?.category || (categories[0] || ''),
    vendorId: product?.vendorId || (vendors[0]?.id || ''), vendorName: product?.vendorName || (vendors[0]?.name || ''),
    purchaseRate: product?.purchaseRate || 0, price: product?.price || 0, stockQuantity: product?.stockQuantity || 0,
    purchaseGst: product?.purchaseGst || 0, discount: product?.discount || 0,
  });
  
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* ... Unchanged ... */ };
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => { /* ... Unchanged ... */ };

  return ( <div className="fixed inset-0 ...">{/* ... Modal JSX ... */}</div> );
};

const CategoryModal = ({ categories, onAdd, onDelete, onClose }: { categories: string[], onAdd: (cat: string) => void, onDelete: (cat: string) => void, onClose: () => void }) => { /* ... Unchanged ... */ };

export default Products;