import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, X, Download, Layers } from 'lucide-react';
import { auth } from '@/lib/firebase'; // Corrected Path
import { onAuthStateChanged } from 'firebase/auth'; // Corrected Path
import { utils, writeFile } from 'xlsx';
import Barcode from 'react-barcode';

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
  createdAt: string;
  updatedAt: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>(['Silk Saree', 'Kurti']);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in.");
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true); setError(null);
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}/products/all`, { headers });
        if (response.status === 403) throw new Error("Permission denied.");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProducts(data);
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        setError(error.message || "Could not load product data.");
      } finally {
        setIsLoading(false);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { fetchProducts(); } 
      else { setIsLoading(false); setError("You are not logged in."); }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProduct = async (productToSave: any) => {
    const method = productToSave.id ? 'PATCH' : 'POST';
    const endpoint = productToSave.id ? `${API_URL}/products/${productToSave.id}` : `${API_URL}/products`;
    try {
      const headers = await getAuthHeader();
      const response = await fetch(endpoint, { method, headers, body: JSON.stringify(productToSave) });
      if (!response.ok) throw new Error('Failed to save product');
      const savedProduct = await response.json();
      if (method === 'POST') {
        setProducts([...products, savedProduct]);
      } else {
        setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Error saving product.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const headers = await getAuthHeader();
        await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE', headers });
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Error deleting product.");
      }
    }
  };

  const handleOpenModal = (product: Product | null) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );
  
  if (isLoading) return <div className="p-6">Authenticating and loading data...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input type="text" placeholder="Search by Name, Category, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-1/3" />
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
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4">₹{(product.purchaseRate || 0).toFixed(2)}</td>
                  <td className="p-4">₹{(product.price || 0).toFixed(2)}</td>
                  <td className="p-4 font-bold">{product.stockQuantity}</td>
                  <td className="p-4">
                    <div className="flex gap-3">
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
      
      {isModalOpen && <ProductFormModal product={editingProduct} categories={categories} onSave={handleSaveProduct} onClose={handleCloseModal} />}
      {isCategoryModalOpen && <CategoryModal categories={categories} onClose={() => setCategoryModalOpen(false)} />}
    </div>
  );
};

const ProductFormModal = ({ product, categories, onSave, onClose }: any) => { /* ... */ };
const CategoryModal = ({ categories, onClose }: any) => { /* ... */ };

export default Products;