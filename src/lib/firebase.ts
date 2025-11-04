// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBut7QaNCIAZX-uptI6wGn35jIyf3Yv5us",
  authDomain: "tgt-debb0.firebaseapp.com",
  projectId: "tgt-debb0",
  storageBucket: "tgt-debb0.firebasestorage.app",
  messagingSenderId: "821973944217",
  appId: "1:821973944217:web:8e919d05c68b9a9221f508",
  measurementId: "G-HH0F2R98ZF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional: Analytics (only if you use it)
export const analytics = getAnalytics(app);

export default app;
