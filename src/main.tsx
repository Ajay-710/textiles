// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- THIS IS THE CRUCIAL FIX ---
// This line imports the firebase configuration and runs the initializeApp function
// before any other part of your application.
import '@/lib/firebase';
// -------------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);