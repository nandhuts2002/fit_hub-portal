// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5PHKGLZnqYb400vWXr9SzI-xb9FLtQjU",
  authDomain: "fitfusions-3e728.firebaseapp.com",
  projectId: "fitfusions-3e728",
  storageBucket: "fitfusions-3e728.firebasestorage.app",
  messagingSenderId: "701093278459",
  appId: "1:701093278459:web:fd1939aff684667613365e",
  measurementId: "G-3KB9HHP1CJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
