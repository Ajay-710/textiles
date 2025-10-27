import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

type LoginType = 'user' | 'admin';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [loginType, setLoginType] = useState<LoginType>('user');

  const commonButtonStyles = "w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-300";
  const activeButtonStyles = "bg-white shadow text-indigo-700";
  const inactiveButtonStyles = "text-blue-100 hover:bg-white/[0.15] hover:text-white";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-2xl bg-black/40 backdrop-blur-xl ring-1 ring-black/5">
              <div className="p-1 space-x-1 bg-white/20 rounded-xl">
                <button
                  onClick={() => setLoginType('user')}
                  className={`${commonButtonStyles} ${loginType === 'user' ? activeButtonStyles : inactiveButtonStyles}`}
                >
                  Cashier Login
                </button>
                <button
                  onClick={() => setLoginType('admin')}
                  className={`${commonButtonStyles} ${loginType === 'admin' ? activeButtonStyles : inactiveButtonStyles}`}
                >
                  Admin Login
                </button>
              </div>

              {loginType === 'user' ? <UserLoginForm /> : <AdminLoginForm />}

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

// --- Cashier Login Form (Unchanged) ---
const UserLoginForm = () => {
  const handleCashierLogin = (event: React.FormEvent) => {
    event.preventDefault();
    window.location.href = 'https://after-login-page.vercel.app/cashier-dashboard';
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">
        Cashier Sign In
      </h2>
      <form className="mt-8 space-y-6" onSubmit={handleCashierLogin}>
        {/* Input fields... */}
        <div className="rounded-md -space-y-px">
          <div>
            <label htmlFor="user-email-address" className="sr-only">Email address</label>
            <input id="user-email-address" name="email" type="text" autoComplete="email" required className="relative block w-full px-3 py-2 text-white placeholder-gray-300 bg-white/10 border border-gray-500 rounded-none appearance-none rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Email address" />
          </div>
          <div>
            <label htmlFor="user-password" className="sr-only">Password</label>
            <input id="user-password" name="password" type="password" autoComplete="current-password" required className="relative block w-full px-3 py-2 text-white placeholder-gray-300 bg-white/10 border border-gray-500 rounded-none appearance-none rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Password" />
          </div>
        </div>
        <div>
          <button type="submit" className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
};

// --- THIS IS THE MODIFIED COMPONENT ---
const AdminLoginForm = () => {
  // 1. Create a function to handle the admin form submission
  const handleAdminLogin = (event: React.FormEvent) => {
    // 2. Prevent the default page refresh behavior
    event.preventDefault();
    
    // 3. Perform the redirect to the admin dashboard
    window.location.href = 'https://after-login-page.vercel.app/admin-dashboard';
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">
        Administrator Access
      </h2>
      {/* 4. Connect the function to the form's onSubmit event */}
      <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
        <div className="rounded-md -space-y-px">
          <div>
            <label htmlFor="admin-email-address" className="sr-only">Admin Email</label>
            <input id="admin-email-address" name="email" type="text" autoComplete="email" required className="relative block w-full px-3 py-2 text-white placeholder-gray-300 bg-white/10 border border-gray-500 rounded-none appearance-none rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Admin Email" />
          </div>
          <div>
            <label htmlFor="admin-password" className="sr-only">Password</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" required className="relative block w-full px-3 py-2 text-white placeholder-gray-300 bg-white/10 border border-gray-500 rounded-none appearance-none rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Password" />
          </div>
        </div>
        <div>
          <button type="submit" className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md group hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Access Admin Panel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginModal;