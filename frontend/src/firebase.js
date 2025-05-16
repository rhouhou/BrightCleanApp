// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "brightclean-app-90101.firebaseapp.com",
  projectId: "brightclean-app-90101",
  storageBucket: "brightclean-app-90101.firebasestorage.app",
  messagingSenderId: "532526989573",
  appId: "1:532526989573:web:0a2d611ddd33b91b50b76c",
  measurementId: "G-REQ02SQVBZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);