// Firebase Configuration for Expo/Web
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, User } from 'firebase/auth';

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyD2uVhZHFHManM-TLc0McOODr8v0Wt7o4U",
  authDomain: "supper-8cb60.firebaseapp.com",
  projectId: "supper-8cb60",
  storageBucket: "supper-8cb60.firebasestorage.app",
  messagingSenderId: "936008982768",
  appId: "1:936008982768:android:332d1fccff91c0f5e9e235"
};

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth
export const firebaseAuth: Auth = getAuth(app);
export const firebaseApp: FirebaseApp = app;

// Export Firebase User type
export type FirebaseUser = User;

// Utility functions
export const getCurrentFirebaseUser = () => firebaseAuth.currentUser;

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  const { onAuthStateChanged } = require('firebase/auth');
  return onAuthStateChanged(firebaseAuth, callback);
};