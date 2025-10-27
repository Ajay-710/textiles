// src/components/LoginModal.tsx
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user');
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
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
  const navigate = useNavigate();
  const handleCashierLogin = (event: React.FormEvent) => {
    event.preventDefault();
    onClose();
    // Correctly navigates to the cashier's billing screen
    navigate('/cashier'); 
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">Cashier Sign In</h2>
      <form className="mt-8 space-y-4" onSubmit={handleCashierLogin}>
        <div><input id="user-email-address" type="text" required className="form-input bg-white/10 text-white placeholder-gray-300 border-gray-500" placeholder="Username or Email" /></div>
        <div><input id="user-password-address" type="password" required className="form-input bg-white/10 text-white placeholder-gray-300 border-gray-500" placeholder="Password" /></div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Sign in</button>
      </form>
    </div>
  );
};

const AdminLoginForm = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const handleAdminLogin = (event: React.FormEvent) => {
    event.preventDefault();
    onClose();
    // Correctly navigates to the admin's default screen (products)
    navigate('/admin'); 
  };
  
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">Administrator Access</h2>
      <form className="mt-8 space-y-4" onSubmit={handleAdminLogin}>
        <div><input id="admin-email-address" type="text" required className="form-input bg-white/10 text-white placeholder-gray-300 border-gray-500" placeholder="Admin Username" /></div>
        <div><input id="admin-password-address" type="password" required className="form-input bg-white/10 text-white placeholder-gray-300 border-gray-500" placeholder="Password" /></div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">Access Admin Panel</button>
      </form>
    </div>
  );
};

export default LoginModal;