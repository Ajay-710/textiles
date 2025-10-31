import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, X, Download, Layers } from 'lucide-react';
// We are not using useLocalStorage anymore for this component's main data

// --- THIS IS THE CORRECTED URL ---
const API_URL = 'https://product-service-821973944217.asia-southeast1.run.app';
// ---------------------------------

// Data Structures
interface Product {
  id: string; // Cloud Run/Firestore IDs are typically strings
  dateAdded: string;
  supplierName: string;
  supplierId: string;
  name: string;
  category: string;
  purchaseRate: number;
  price: number;
  qty: number;
  gst: number;
}

const Products = () => {
  // The products state starts empty and will be filled by the API call
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // You might want to fetch categories from the backend as well
  const [categories, setCategories] = useState<string[]>(['Silk Saree', 'Kurti']);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);


  // --- FETCH DATA (READ) ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/products`); // Assuming your endpoint is /products
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        alert("Could not load product data from the server. Please check the console for more details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []); // Empty array ensures this runs only once on component mount

  const handleSaveProduct = async (productToSave: Omit<Product, 'id'> & { id?: string }) => {
    const method = productToSave.id ? 'PUT' : 'POST';
    const endpoint = productToSave.id ? `${API_URL}/products/${productToSave.id}` : `${API_URL}/products`;

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSave),
      });

      if (!response.ok) throw new Error('Failed to save product');

      if (method === 'POST') {
        const newProduct = await response.json();
        setProducts([...products, newProduct]);
      } else {
        setProducts(products.map(p => p.id === productToSave.id ? (productToSave as Product) : p));
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
        await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE' });
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Error deleting product.");
      }
    }
  };

  // ... (The rest of the component, including JSX and helper components, remains the same as the fully functional version)
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Stock / Products Details</h1>
        <div className="bg-white p-10 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">Loading product data from the server...</p>
        </div>
      </div>
    );
  }
  
  // Return the full JSX for the Products component here...
};

// ... (ProductFormModal and CategoryModal helper components go here) ...

export default Products;