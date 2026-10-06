import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyCs49PZD-vd3KJVDwU4QWIz9JmLf_maNHY',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'sikapos-27544.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'sikapos-27544',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'sikapos-27544.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '679075189907',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:679075189907:web:8a8a29a4f3897cfad86966',
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-XLKNSBJ66G',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};
export type { ConfirmationResult };
