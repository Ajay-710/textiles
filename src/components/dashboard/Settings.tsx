import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Save } from 'lucide-react';

const Settings = () => {
  const [shopName, setShopName] = useLocalStorage('shopName', 'T.Gopi Textiles');
  const [gstNumber, setGstNumber] = useLocalStorage('gstNumber', 'YOUR_GST_NUMBER_HERE');
  const [billMessage, setBillMessage] = useLocalStorage('billMessage', 'Thank You For Your Purchasing');
  
  // --- NEW: State for Default GST Percentage ---
  const [defaultGst, setDefaultGst] = useLocalStorage('defaultGst', 5); // Default is 5%

  const handleSave = () => {
    // In a real app, you might do more here, but for now, the data is saved automatically by the hook.
    alert("Settings Saved!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-4 max-w-lg">
          <div>
            <label htmlFor="shopName" className="font-medium text-gray-700">Shop Name</label>
            <input 
              id="shopName" 
              type="text" 
              value={shopName} 
              onChange={e => setShopName(e.target.value)} 
              className="form-input mt-1" 
            />
          </div>
          <div>
            <label htmlFor="gstNumber" className="font-medium text-gray-700">GST Number</label>
            <input 
              id="gstNumber" 
              type="text" 
              value={gstNumber} 
              onChange={e => setGstNumber(e.target.value)} 
              className="form-input mt-1" 
            />
          </div>
          <div>
            <label htmlFor="billMessage" className="font-medium text-gray-700">Custom Bill Message</label>
            <input 
              id="billMessage" 
              type="text" 
              value={billMessage} 
              onChange={e => setBillMessage(e.target.value)} 
              className="form-input mt-1" 
            />
          </div>
          
          {/* --- NEW: Input for Default GST Percentage --- */}
          <div>
            <label htmlFor="defaultGst" className="font-medium text-gray-700">Default GST Percentage (%)</label>
            <input 
              id="defaultGst" 
              type="number" 
              value={defaultGst} 
              onChange={e => setDefaultGst(parseFloat(e.target.value) || 0)} 
              className="form-input mt-1" 
            />
          </div>
          
          <div className="pt-2">
            <button onClick={handleSave} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;