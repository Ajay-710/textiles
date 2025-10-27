// src/components/LoginModal.tsx

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user');
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* ... The Transition and Dialog structure remains the same ... */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-2xl bg-black/40 backdrop-blur-xl ring-1 ring-black/5">
              <div className="p-1 space-x-1 bg-white/20 rounded-xl">
                <button onClick={() => setLoginType('user')} className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-300 ${loginType === 'user' ? 'bg-white shadow text-indigo-700' : 'text-blue-100 hover:bg-white/[0.15] hover:text-white'}`}>Cashier Login</button>
                <button onClick={() => setLoginType('admin')} className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-300 ${loginType === 'admin' ? 'bg-white shadow text-indigo-700' : 'text-blue-100 hover:bg-white/[0.15] hover:text-white'}`}>Admin Login</button>
              </div>
              {loginType === 'user' ? <UserLoginForm onClose={onClose} /> : <AdminLoginForm onClose={onClose} />}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

const UserLoginForm = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate(); // 2. Initialize navigate

  const handleCashierLogin = (event: React.FormEvent) => {
    event.preventDefault();
    onClose(); // Close the modal
    navigate('/cashier-dashboard'); // 3. Navigate to the internal route
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">Cashier Sign In</h2>
      <form className="mt-8 space-y-6" onSubmit={handleCashierLogin}>
        {/* ... form inputs ... */}
        <div><input id="user-email-address" required className="form-input bg-white/10 text-white placeholder-gray-300" placeholder="Email address" /></div>
        <div><input id="user-password" type="password" required className="form-input bg-white/10 text-white placeholder-gray-300" placeholder="Password" /></div>
        <button type="submit" className="sidebar-btn bg-indigo-600 hover:bg-indigo-700">Sign in</button>
      </form>
    </div>
  );
};

const AdminLoginForm = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate(); // 2. Initialize navigate

  const handleAdminLogin = (event: React.FormEvent) => {
    event.preventDefault();
    onClose(); // Close the modal
    navigate('/admin-dashboard'); // 3. Navigate to the internal route
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">Administrator Access</h2>
      <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
        {/* ... form inputs ... */}
        <div><input id="admin-email-address" type="email" required className="form-input bg-white/10 text-white placeholder-gray-300" placeholder="Admin Email" /></div>
        <div><input id="admin-password" type="password" required className="form-input bg-white/10 text-white placeholder-gray-300" placeholder="Password" /></div>
        <button type="submit" className="sidebar-btn bg-red-600 hover:bg-red-700">Access Admin Panel</button>
      </form>
    </div>
  );
};

export default LoginModal;