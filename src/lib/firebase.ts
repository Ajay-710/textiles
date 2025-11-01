// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBut7QaNCIAZX-uptI6wGn35jIyf3Yv5us",
  authDomain: "tgt-debb0.firebaseapp.com",
  projectId: "tgt-debb0",
  storageBucket: "tgt-debb0.firebasestorage.app",
  messagingSenderId: "821973944217",
  appId: "1:821973944217:web:8e919d05c68b9a9221f508",
  measurementId: "G-HH0F2R98ZF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;