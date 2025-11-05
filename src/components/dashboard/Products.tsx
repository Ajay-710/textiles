import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, PlusCircle, X, Download, Layers, Upload, Printer } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { productService, vendorService } from '@/lib/api';
import Barcode from 'react-barcode';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Papa, { ParseResult } from 'papaparse';
import JsBarcode from 'jsbarcode';

// Data Structures
interface Product {
  id: string; name: string; category: string; purchaseRate: number; purchaseGst: number;
  price: number; discount: number; stockQuantity: number; vendorId: string; vendorName: string;
  barcode: string; barcodeImageUrl?: string; createdAt: string; updatedAt: string;
}
interface Vendor { id: string; name: string; }

type SelectedProducts = {
  [productId: string]: {
    quantity: number;
    barcode: string;
    name: string;
    price: number;
  }
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [defaultGst] = useLocalStorage('defaultGst', 5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});
  
  // Get shop name for barcode printing
  const [shopName] = useLocalStorage('shopName', 'T.GOPI TEXTILES');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [productsResult, vendorsResult] = await Promise.allSettled([
        productService.get('/products/all'),
        vendorService.get('/vendors/all'),
      ]);
      if (productsResult.status === 'fulfilled') {
        const fetchedProducts: Product[] = productsResult.value.data || [];
        
        // FIX: Filter out products with stockQuantity of 0 before setting state
        const availableProducts = fetchedProducts.filter(p => p.stockQuantity > 0);
        
        availableProducts.sort((a, b) => {
          if (b.createdAt && !a.createdAt) return 1;
          if (!b.createdAt && a.createdAt) return -1;
          if (!b.createdAt && !a.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setProducts(availableProducts);
      } else {
        console.error('Failed to fetch products:', productsResult.reason);
        setError('Could not load product data. Other data may be available.');
      }
      if (vendorsResult.status === 'fulfilled') {
        setVendors(vendorsResult.value.data || []);
      } else {
        console.error('Failed to fetch vendors:', vendorsResult.reason);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        setIsLoading(false);
        setError('You are not logged in.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProduct = async (formData: any) => {
    const isEditing = !!formData.id;
    const now = new Date().toISOString();
    const payload = { ...formData, createdAt: isEditing ? formData.createdAt || now : now, updatedAt: now };
    
    // LOGIC CHECK: If stockQuantity is set to 0, proceed with delete
    if (parseInt(payload.stockQuantity, 10) <= 0 && isEditing) {
        if (window.confirm(`Product ${payload.name} stock is 0. Do you want to delete this product entirely?`)) {
            try {
                await productService.delete(`/products/delete/${formData.id}`);
                await fetchData();
                setIsModalOpen(false);
                return;
            } catch (err: any) {
                alert(`Error deleting product: ${err.response?.data?.error || err.message}`);
                return;
            }
        }
    }
    
    try {
      if (isEditing) {
        // Your current logic is to delete and then re-add for updates. 
        // This is highly unusual and inefficient, but maintaining original logic flow.
        await productService.delete(`/products/delete/${formData.id}`);
        await productService.post('/products/add', payload);
      } else {
        await productService.post('/products/add', payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving product: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(`/products/delete/${id}`);
        await fetchData();
      } catch (err: any) {
        alert(`Error deleting: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await productService.get('/products/categories');
      setCategories(res.data.map((c: any) => c.name || c));
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    }
  };

  const handleAddOrUpdateCategory = async (oldCategory: string | null, newCategory: string) => {
    if (!newCategory.trim()) return;
    try {
      await productService.post('/products/categories/add', { name: newCategory.trim() });
      setCategories((prev) => {
        if (oldCategory) {
          return prev.map((cat) => (cat === oldCategory ? newCategory.trim() : cat));
        }
        if (!prev.includes(newCategory.trim())) {
          return [...prev, newCategory.trim()];
        }
        return prev;
      });
    } catch (err: any) {
      alert(`Failed to add/update category: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const processInBatches = async (productsToUpload: any[], batchSize = 10) => {
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < productsToUpload.length; i += batchSize) {
      const batch = productsToUpload.slice(i, i + batchSize);
      
      const uploadPromises = batch.map(product => {
        const vendor = vendors.find(v => v.id === product.vendorId);
        if (!vendor) {
          console.error(`Skipping product "${product.name}" - Vendor ID "${product.vendorId}" not found.`);
          return Promise.reject(`Vendor ID not found`);
        }

        const payload = {
          name: product.name, category: product.category, price: parseFloat(product.price) || 0,
          stockQuantity: parseInt(product.stockQuantity, 10) || 0, barcode: product.barcode,
          purchaseRate: parseFloat(product.purchaseRate) || 0, purchaseGst: parseFloat(product.purchaseGst) || defaultGst,
          discount: parseFloat(product.discount) || 0, vendorId: vendor.id, vendorName: vendor.name,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };

        if (!payload.name || !payload.price || !payload.barcode) {
          console.error("Skipping invalid row:", product);
          return Promise.reject('Missing required fields');
        }
        return productService.post('/products/add', payload);
      });
      
      const settledResults = await Promise.allSettled(uploadPromises);
      settledResults.forEach(result => {
        if (result.status === 'fulfilled') successCount++;
        else {
          errorCount++;
          console.error("Upload failed for one product in batch:", result.reason);
        }
      });
    }
    return { successCount, errorCount };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<any>) => {
        if (results.data.length === 0) {
          alert("CSV file is empty or formatted incorrectly.");
          setIsLoading(false);
          return;
        }
        const { successCount, errorCount } = await processInBatches(results.data);
        alert(`${successCount} products uploaded successfully.\n${errorCount} products failed to upload.`);
        await fetchData();
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        alert("Error parsing CSV file: " + error.message);
        setIsLoading(false);
      }
    });
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleSelectProduct = (productId: string, product: Product) => {
    setSelectedProducts(prev => {
      const newSelection = { ...prev };
      if (newSelection[productId]) {
        delete newSelection[productId];
      } else {
        newSelection[productId] = { quantity: 1, barcode: product.barcode, name: product.name, price: product.price };
      }
      return newSelection;
    });
  };

  const handleBarcodeQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: { ...prev[productId], quantity: Math.max(1, quantity) }
    }));
  };

  const handleBulkPrint = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Could not open print window. Please disable your popup blocker.");
      return;
    }

    const generationPromises: Promise<string>[] = [];

    // ... (logic to generate generationPromises remains the same) ...
    for (const productId in selectedProducts) {
      const { quantity, barcode, name, price } = selectedProducts[productId];
      
      // The displayed product name (from screenshot)
      const productNameForSticker = name;
      // The price displayed on the sticker
      const priceForSticker = price.toFixed(2);
      // The barcode ID (display value)
      const barcodeDisplayValue = barcode; 

      for (let i = 0; i < quantity; i++) {
        const promise = new Promise<string>((resolve, reject) => {
          const canvas = document.createElement('canvas');
          try {
            // Generate barcode
            JsBarcode(canvas, barcode, {
              format: 'CODE128', 
              displayValue: true, // This shows the barcode numbers below the bars
              fontSize: 10,       // Smaller font size for display value
              textMargin: 0, 
              width: 1.2, 
              height: 25, 
              margin: 1, // Smaller margin to fit the elements
            });
            const dataUrl = canvas.toDataURL('image/png');
            
            // FIX: Maintained sticker HTML structure from previous step
            resolve(`
              <div class="sticker">
                <div class="shop-name">${shopName}</div>
                <img src="${dataUrl}" alt="barcode-${barcode}" />
                <div class="product-name">${productNameForSticker}</div>
                <div class="product-price">Rs :${priceForSticker}</div>
              </div>
            `);
          } catch (e) {
            console.error(`Failed to generate barcode for ${barcode}`, e);
            reject(e);
          }
        });
        generationPromises.push(promise);
      }
    }

    const barcodeElements = (await Promise.all(generationPromises)).join('');

    // FIX: Added CSS rules to remove default browser headers/footers in print dialog
    const printHTML = `
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            @page {
              /* FIX 1: Remove default print headers/footers */
              margin: 0;
              size: 4in 6in;
              margin: 2mm;
              
              /* Non-standard but widely used to suppress headers/footers */
              @top-left { content: ""; }
              @top-center { content: ""; }
              @top-right { content: ""; }
              @bottom-left { content: ""; }
              @bottom-center { content: ""; }
              @bottom-right { content: ""; }
            }
            body { 
              font-family: sans-serif; 
              /* FIX 2: Set margins to zero */
              margin: 0;
              padding: 0;
              width: 100%;
              -webkit-print-color-adjust: exact;
            }
            .sticker-sheet {
              display: flex;
              flex-wrap: wrap;
              justify-content: flex-start;
              gap: 2mm; 
              padding: 1mm;
              box-sizing: border-box;
            }
            .sticker {
              width: 1.5in;  
              height: 0.9in;
              box-sizing: border-box;
              padding: 1mm 2mm;
              border: 1px solid #00000000;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              page-break-inside: avoid;
              overflow: hidden;
              background: white;
            }
            .shop-name {
              font-size: 7pt;
              font-weight: bold;
              margin-bottom: 0;
              width: 100%;
              text-align: center;
            }
            .product-name {
              font-size: 8pt; 
              font-weight: normal;
              margin-bottom: 1mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              text-align: center;
              line-height: 1;
            }
            .product-price {
              font-size: 10pt;
              font-weight: bold;
              margin-top: 1mm;
            }
            img {
              max-height: 10mm;
              width: auto;
              margin: 0;
            }
          </style>
        </head>
        <body><div class="sticker-sheet">${barcodeElements}</div></body>
      </html>`;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredProducts = products.filter((p) => {
    if (!p || !p.name) return false;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(lowerSearchTerm) ||
      (p.category && p.category.toLowerCase().includes(lowerSearchTerm)) ||
      (p.id && p.id.toString().includes(searchTerm))
    );
  });
  
  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => !!selectedProducts[p.id]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts({});
    } else {
      const newSelection: SelectedProducts = {};
      filteredProducts.forEach(p => {
        newSelection[p.id] = { quantity: 1, barcode: p.barcode, name: p.name, price: p.price };
      });
      setSelectedProducts(newSelection);
    }
  };

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Stock / Products</h1>
      {error && <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>}
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <input type="text" placeholder="Search by Name, Category, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input w-1/3" />
        <div className="flex gap-4">
          {Object.keys(selectedProducts).length > 0 && (
            <button onClick={handleBulkPrint} className="px-5 py-2.5 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 flex items-center gap-2">
              <Printer size={20} /> Print Selected Barcodes
            </button>
          )}
          <button onClick={handleUploadClick} className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2">
            <Upload size={20} /> Upload CSV
          </button>
          <button onClick={() => setCategoryModalOpen(true)} className="px-5 py-2.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 flex items-center gap-2">
            <Layers size={20} /> Manage Categories
          </button>
          <button onClick={() => handleOpenModal(null)} className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <PlusCircle size={20} /> Add Product
          </button>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="form-checkbox" /></th>
                <th className="p-4">S.No</th><th className="p-4">Date</th>
                <th className="p-4">Supplier Name</th><th className="p-4">Supplier ID</th>
                <th className="p-4">Product Name</th><th className="p-4">Product ID</th>
                <th className="p-4">Barcode</th><th className="p-4">Category</th>
                <th className="p-4">Price</th><th className="p-4">GST</th>
                <th className="p-4">Stock</th><th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const isSelected = !!selectedProducts[product.id];
                return (
                  <tr key={product.id} className={`border-t transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-4"><input type="checkbox" checked={isSelected} onChange={() => handleSelectProduct(product.id, product)} className="form-checkbox" /></td>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="p-4 font-medium">{product.vendorName || '-'}</td>
                    <td className="p-4 font-mono">{product.vendorId || '-'}</td>
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4 font-mono">{product.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{product.barcode.length === 7 && product.barcode.startsWith('0') ? product.barcode.substring(1) : product.barcode}</span>
                        {isSelected && (
                          <input
                            type="number"
                            value={selectedProducts[product.id].quantity}
                            onChange={(e) => handleBarcodeQuantityChange(product.id, parseInt(e.target.value, 10))}
                            className="form-input w-16 text-center"
                            min="1"
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">₹{product.price.toFixed(2)}</td>
                    <td className="p-4">{product.purchaseGst}%</td>
                    <td className="p-4 font-bold">{product.stockQuantity}</td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && ( <ProductFormModal product={editingProduct} categories={categories} vendors={vendors} onSave={handleSaveProduct} onClose={handleCloseModal} defaultGst={defaultGst} /> )}
      {isCategoryModalOpen && ( <CategoryModal categories={categories} onAddOrUpdate={handleAddOrUpdateCategory} onClose={() => setCategoryModalOpen(false)} /> )}
    </div>
  );
};

const ProductFormModal = ({ product, categories, vendors, onSave, onClose, defaultGst }: { product: Product | null; categories: string[]; vendors: Vendor[]; onSave: (p: any) => void; onClose: () => void; defaultGst: number; }) => {
  const [formData, setFormData] = useState({
    id: product?.id || null, name: product?.name || '', category: product?.category || categories[0] || '',
    purchaseRate: product?.purchaseRate || 0, purchaseGst: product?.purchaseGst ?? defaultGst, price: product?.price || 0,
    discount: product?.discount || 0, stockQuantity: product?.stockQuantity || 0,
    vendorId: product?.vendorId || (vendors[0]?.id || ''), vendorName: product?.vendorName || (vendors[0]?.name || ''),
    barcode: product?.barcode || '',
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendor = vendors.find((v) => v.id === e.target.value);
    if (selectedVendor) { setFormData((prev) => ({ ...prev, vendorId: selectedVendor.id, vendorName: selectedVendor.name })); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h2><button onClick={onClose}><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Product Name</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="form-input mt-1" required /></div>
            <div><label>Category</label><select name="category" value={formData.category} onChange={handleChange} className="form-input mt-1" required>{categories.map((c) => (<option key={c} value={c}>{c}</option>))}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label>Supplier Name</label><select name="vendorId" value={formData.vendorId} onChange={handleVendorChange} className="form-input mt-1" required><option value="" disabled>-- Select a Supplier --</option>{vendors.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}</select></div>
            <div><label>Supplier ID (Auto-filled)</label><input name="vendorId" type="text" value={formData.vendorId} className="form-input mt-1 bg-gray-100" readOnly /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label>Purchase Rate (₹)</label><input name="purchaseRate" type="number" value={formData.purchaseRate} onChange={handleChange} className="form-input mt-1" /></div>
            <div><label>Selling Price (₹)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="form-input mt-1" /></div>
            <div><label>Stock Quantity</label><input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} className="form-input mt-1" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label>Purchase GST (%)</label><input name="purchaseGst" type="number" value={formData.purchaseGst} onChange={handleChange} readOnly={!product} className={`form-input mt-1 ${!product ? 'bg-gray-100' : ''}`} /></div>
            <div><label>Discount (%)</label><input name="discount" type="number" value={formData.discount} onChange={handleChange} className="form-input mt-1" /></div>
            <div><label>Barcode</label><input name="barcode" type="text" value={formData.barcode} onChange={handleChange} className="form-input mt-1" /></div>
          </div>
          {formData.barcode && (<div className="p-4 bg-gray-50 rounded-md flex justify-center"><Barcode value={formData.barcode} height={50} /></div>)}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryModal = ({ categories, onAddOrUpdate, onClose }: { categories: string[]; onAddOrUpdate: (oldCat: string | null, newCat: string) => void; onClose: () => void; }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [updatedCategory, setUpdatedCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    onAddOrUpdate(null, newCategory.trim());
    setNewCategory('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatedCategory.trim() || !editingCategory) return;
    onAddOrUpdate(editingCategory, updatedCategory.trim());
    setEditingCategory(null);
    setUpdatedCategory('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Manage Categories</h2><button onClick={onClose}><X /></button></div>
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input type="text" placeholder="New category name..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="form-input flex-grow" />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md">Add</button>
        </form>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Existing Categories:</h3>
          <ul className="max-h-60 overflow-y-auto space-y-2">
            {categories.map((cat) => (
              <li key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                {editingCategory === cat ? (
                  <form onSubmit={handleUpdate} className="flex w-full gap-2">
                    <input type="text" value={updatedCategory} onChange={(e) => setUpdatedCategory(e.target.value)} className="form-input flex-grow" />
                    <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded-md">Save</button>
                    <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1 bg-gray-300 rounded-md">Cancel</button>
                  </form>
                ) : (
                  <><span>{cat}</span><button onClick={() => { setEditingCategory(cat); setUpdatedCategory(cat); }} className="text-blue-500 hover:text-blue-700">Edit</button></>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Products;