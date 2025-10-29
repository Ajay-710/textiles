import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Pencil, Trash2, PlusCircle, X } from 'lucide-react';

// --- Data Structures ---
interface Supplier {
  id: string;
  name: string;
  contact: string;
  gst: string;
  address: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', [
    { id: 'S-001', name: 'Kanchi Weavers', contact: '9876543210', gst: '33ABCDE1234F1Z5', address: 'Chennai, Tamil Nadu' },
    { id: 'S-002', name: 'Benaras Creations', contact: '9876543211', gst: '09ABCDE1234F1Z6', address: 'Varanasi, Uttar Pradesh' },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (supplier: Supplier | null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSaveSupplier = (supplierToSave: Omit<Supplier, 'id'> & { id?: string }) => {
    if (supplierToSave.id) { // Editing
      setSuppliers(suppliers.map(s => s.id === supplierToSave.id ? (supplierToSave as Supplier) : s));
    } else { // Adding
      const newId = `S-${(suppliers.length + 1).toString().padStart(3, '0')}`;
      setSuppliers([...suppliers, { ...supplierToSave, id: newId }]);
    }
    handleCloseModal();
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      setSuppliers(suppliers.filter(s => s.id !== supplierId));
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Supplier Management</h1>
        <button onClick={() => handleOpenModal(null)} className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2">
          <PlusCircle size={20} /> Add New Supplier
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <input 
          type="text" 
          placeholder="Search by Supplier Name or ID..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input w-full md:w-1/3"
        />
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Supplier ID</th><th className="p-4">Supplier Name</th>
                <th className="p-4">Contact No.</th><th className="p-4">GST Number</th>
                <th className="p-4">Address</th><th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supplier => (
                <tr key={supplier.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-mono">{supplier.id}</td>
                  <td className="p-4 font-medium">{supplier.name}</td>
                  <td className="p-4">{supplier.contact}</td>
                  <td className="p-4">{supplier.gst}</td>
                  <td className="p-4">{supplier.address}</td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button onClick={() => handleOpenModal(supplier)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && <SupplierFormModal supplier={editingSupplier} onSave={handleSaveSupplier} onClose={handleCloseModal} />}
    </div>
  );
};

// --- Helper Component for the Add/Edit Supplier Modal ---
const SupplierFormModal = ({ supplier, onSave, onClose }: { supplier: Supplier | null, onSave: (s: Omit<Supplier, 'id'> & { id?: string }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState(supplier || {
    name: '', contact: '', gst: '', address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: supplier?.id });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Supplier Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input mt-1" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Contact No.</label>
              <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="form-input mt-1" />
            </div>
            <div>
              <label>GST Number</label>
              <input type="text" value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} className="form-input mt-1" />
            </div>
          </div>
          <div>
            <label>Address</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="form-input mt-1" />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Supplier</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Suppliers;