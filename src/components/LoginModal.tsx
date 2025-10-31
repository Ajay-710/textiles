// src/components/LoginModal.tsx
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add a loading state

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true); // Start loading

    // --- DEBUGGING LOGS ---
    console.log("Attempting to log in with:");
    console.log("Email:", email);
    console.log("Password:", password);
    // --------------------

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login successful!"); // Success message
      onClose();
      navigate('/admin/products');
    } catch (err: any) {
      console.error("Firebase login failed:", err); // Log the actual Firebase error
      setError("Invalid admin credentials. Please check email and password.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };
  
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white">Administrator Access</h2>
      <form className="mt-8 space-y-4" onSubmit={handleAdminLogin}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input bg-white/10 text-white" placeholder="Admin Email"/>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="form-input bg-white/10 text-white" placeholder="Password"/>
        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full ...">
          {isLoading ? 'Signing In...' : 'Access Admin Panel'}
        </button>
      </form>
    </div>
  );
};

export default LoginModal;