import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, X, Download, Layers } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in.");
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true); setError(null);
      const headers = await getAuthHeader();
      
      const [productsResponse, vendorsResponse] = await Promise.all([
        fetch(`${API_URL}/products/all`, { headers }),
        fetch(`${API_URL}/vendors/all`, { headers })
      ]);

      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      if (!vendorsResponse.ok) throw new Error('Failed to fetch vendors');
      
      const productsData = await productsResponse.json();
      const vendorsData = await vendorsResponse.json();
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (error: any) {
      console.error("Failed to fetch initial data:", error);
      setError(error.message || "Could not load data from the server.");
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
  
  const handleSaveProduct = async (formData: any) => { /* ... Unchanged ... */ };
  const handleDeleteProduct = async (productId: string) => { /* ... Unchanged ... */ };
  const handleOpenModal = (product: Product | null) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
      {/* ... Top search and buttons bar ... */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* ... Table JSX ... */}
      </div>
      
      {isModalOpen && <ProductFormModal product={editingProduct} categories={categories} vendors={vendors} onSave={handleSaveProduct} onClose={handleCloseModal} />}
      {isCategoryModalOpen && <CategoryModal categories={categories} onClose={() => setCategoryModalOpen(false)} />}
    </div>
  );
};

const ProductFormModal = ({ product, categories, vendors, onSave, onClose }: { product: Product | null, categories: string[], vendors: Vendor[], onSave: (p: any) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    id: product?.id || null,
    name: product?.name || '',
    category: product?.category || (categories[0] || ''),
    vendorId: product?.vendorId || (vendors[0]?.id || ''),
    vendorName: product?.vendorName || (vendors[0]?.name || ''),
    purchaseRate: product?.purchaseRate || 0,
    price: product?.price || 0,
    stockQuantity: product?.stockQuantity || 0,
    purchaseGst: product?.purchaseGst || 0,
    discount: product?.discount || 0,
  });
  
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendor = vendors.find(v => v.id === e.target.value);
    if (selectedVendor) { setFormData(prev => ({ ...prev, vendorId: selectedVendor.id, vendorName: selectedVendor.name })); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Product Name</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="form-input mt-1" required /></div>
            <div><label>Category</label><select name="category" value={formData.category} onChange={handleChange} className="form-input mt-1" required>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Vendor / Supplier</label><select name="vendorId" value={formData.vendorId} onChange={handleVendorChange} className="form-input mt-1" required><option value="" disabled>-- Select a Vendor --</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            <div><label>Vendor ID (Auto-filled)</label><input name="vendorId" type="text" value={formData.vendorId} className="form-input mt-1 bg-gray-100" readOnly/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label>Purchase Rate (₹)</label><input name="purchaseRate" type="number" value={formData.purchaseRate} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Selling Price (₹)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Stock Quantity</label><input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} className="form-input mt-1"/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Purchase GST (%)</label><input name="purchaseGst" type="number" value={formData.purchaseGst} onChange={handleChange} className="form-input mt-1"/></div>
            <div><label>Discount (%)</label><input name="discount" type="number" value={formData.discount} onChange={handleChange} className="form-input mt-1"/></div>
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

const CategoryModal = ({ categories, onClose }: any) => { /* Unchanged */ };

export default Products;