import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, Pencil, Trash2, X } from 'lucide-react';

// --- Data Structures ---
interface Product {
  id: number;
  name: string;
  price: number;
  qty: number;
}
interface Cashier {
  id: number;
  name: string;
}

// --- Placeholder Initial Data ---
const initialProducts: Product[] = [
  { id: 2001, name: "Banarasi Silk Saree", price: 1899, qty: 50 },
  { id: 2002, name: "Kanchipuram Pure Silk", price: 2499, qty: 30 },
  { id: 2003, name: "Cotton Printed Saree", price: 799, qty: 100 },
  { id: 3004, name: "Designer Gown", price: 1999, qty: 35 },
];
const initialCashiers: Cashier[] = [
  { id: 1, name: "Sarah Lee" },
  { id: 2, name: "John Smith" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- State Management ---
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cashiers, setCashiers] = useState<Cashier[]>(initialCashiers);
  
  // State for the "Add Product" form
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, qty: 0 });
  
  // State for the "Add Cashier" form
  const [newCashierName, setNewCashierName] = useState('');
  
  // State to manage the Edit Product modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- Logic Functions ---

  const handleLogout = () => navigate('/');

  // --- Product Management Logic ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0 || newProduct.qty < 0) {
      alert("Please fill in all product fields correctly.");
      return;
    }
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    setProducts([...products, { id: newId, ...newProduct }]);
    setNewProduct({ name: '', price: 0, qty: 0 }); // Reset form
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditingProduct(null); // Close the modal
  };
  
  // --- Cashier Management Logic ---
  const handleAddCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashierName.trim()) return;
    const newId = cashiers.length > 0 ? Math.max(...cashiers.map(c => c.id)) + 1 : 1;
    setCashiers([...cashiers, { id: newId, name: newCashierName }]);
    setNewCashierName(''); // Reset form
  };

  const handleDeleteCashier = (cashierId: number) => {
    if (window.confirm("Are you sure you want to delete this cashier?")) {
      setCashiers(cashiers.filter(c => c.id !== cashierId));
    }
  };
  
  // --- Danger Zone Logic ---
  const handleClearAllData = () => {
    if (window.confirm("DANGER: This will delete ALL products and cashiers. This action cannot be undone. Are you absolutely sure?")) {
      setProducts([]);
      setCashiers([]);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </header>

        <main className="space-y-8">
          {/* Add New Product */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
              <div>
                <label htmlFor="productName" className="text-sm font-medium text-gray-600">Product Name</label>
                <input id="productName" type="text" placeholder="Enter Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="form-input mt-1" />
              </div>
              <div>
                <label htmlFor="price" className="text-sm font-medium text-gray-600">Price</label>
                <input id="price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="form-input mt-1" />
              </div>
              <div>
                <label htmlFor="quantity" className="text-sm font-medium text-gray-600">Quantity</label>
                <input id="quantity" type="number" value={newProduct.qty} onChange={e => setNewProduct({...newProduct, qty: parseInt(e.target.value)})} className="form-input mt-1" />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors h-11">
                <PlusCircle size={20} /> Add Product
              </button>
            </form>
          </section>

          {/* Product List */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6"><h2 className="text-xl font-semibold text-gray-700">Product List</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">ID</th><th className="p-4 font-semibold text-gray-600">Name</th><th className="p-4 font-semibold text-gray-600">Price</th><th className="p-4 font-semibold text-gray-600">Qty</th><th className="p-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50`}>
                      <td className="p-4 text-gray-700">{product.id}</td>
                      <td className="p-4 font-medium text-gray-800">{product.name}</td>
                      <td className="p-4 text-gray-700">₹{product.price.toFixed(2)}</td>
                      <td className="p-4 text-gray-700">{product.qty}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProduct(product)} className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1"><Pencil size={14} /> Edit</button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Manage Cashiers */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Manage Cashiers</h2>
              <form onSubmit={handleAddCashier} className="flex items-end gap-4 mb-4">
                <div className="flex-grow">
                  <label htmlFor="cashierName" className="text-sm font-medium text-gray-600">Cashier Name</label>
                  <input id="cashierName" type="text" placeholder="Enter Cashier Name" value={newCashierName} onChange={e => setNewCashierName(e.target.value)} className="form-input mt-1" />
                </div>
                <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors h-11"><PlusCircle size={20} /> Add</button>
              </form>
              <ul className="space-y-2">
                {cashiers.map(cashier => (
                  <li key={cashier.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span className="text-gray-800">{cashier.name}</span>
                    <button onClick={() => handleDeleteCashier(cashier.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Danger Zone</h2>
              <p className="text-red-700 mb-4 text-sm">These actions are irreversible. Please be certain.</p>
              <button onClick={handleClearAllData} className="w-full px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Clear All Transaction Data</button>
            </section>
          </div>
        </main>
      </div>

      {/* --- Edit Product Modal --- */}
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onSave={handleUpdateProduct} 
          onCancel={() => setEditingProduct(null)} 
        />
      )}
    </div>
  );
};

// --- Separate Component for the Edit Modal ---
const EditProductModal = ({ product, onSave, onCancel }: { product: Product, onSave: (product: Product) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState(product);

  useEffect(() => {
    setFormData(product);
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Edit Product</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editName" className="text-sm font-medium text-gray-600">Product Name</label>
            <input id="editName" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input mt-1" />
          </div>
          <div>
            <label htmlFor="editPrice" className="text-sm font-medium text-gray-600">Price</label>
            <input id="editPrice" type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="form-input mt-1" />
          </div>
          <div>
            <label htmlFor="editQty" className="text-sm font-medium text-gray-600">Quantity</label>
            <input id="editQty" type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value)})} className="form-input mt-1" />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;