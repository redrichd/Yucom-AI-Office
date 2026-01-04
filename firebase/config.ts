
// Standard Firebase v9 modular initialization
// Use scoped packages to ensure modular exports are found correctly
import { initializeApp } from '@firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
import { getStorage } from '@firebase/storage';
import { getAnalytics } from '@firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB0Ck_acu8txsh60H63V67bJLPETcWpe4I",
  authDomain: "liquid-glass-ai-directory.firebaseapp.com",
  projectId: "liquid-glass-ai-directory",
  storageBucket: "liquid-glass-ai-directory.firebasestorage.app",
  messagingSenderId: "287219324068",
  appId: "1:287219324068:web:c6469b3109e931f9e58231",
  measurementId: "G-T2JD1XMYWH"
};

// Initialize Firebase using the modular SDK pattern
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Analytics initialization for browser environments
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

// Helper function for Google authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = () => signOut(auth);