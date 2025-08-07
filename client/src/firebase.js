// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAIKzz6ggbTro9QQ08lY3-tYEUWVQKgWZE",
  authDomain: "fithub-portal.firebaseapp.com",
  projectId: "fithub-portal",
  storageBucket: "fithub-portal.appspot.com",
  messagingSenderId: "556304091871",
  appId: "1:556304091871:web:8f9c2d3e4a5b6c7d8e9f0a1b" // Updated with a proper format
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
