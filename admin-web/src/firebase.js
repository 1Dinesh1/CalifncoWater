import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuzTE2I3nCp2Z_TiT2P1GVaPsv67sx2V8",
  authDomain: "califnco-water.firebaseapp.com",
  projectId: "califnco-water",
  storageBucket: "califnco-water.firebasestorage.app",
  messagingSenderId: "590406562234",
  appId: "1:590406562234:web:a2df017c93960e8bb3ed83"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
