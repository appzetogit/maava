import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// ─── Firebase Configuration (maava-7ddea project) ─────────────────────────
// Auth domain + apiKey from VITE env vars (set in frontend .env)
// Falls back to hardcoded values for local dev convenience.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyBzXOfR_ktA8X9UcZoTxPWmUwrfOXVMYvo",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "maava-7ddea.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "maava-7ddea",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "maava-7ddea.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "595117846778",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:595117846778:web:1c6df2a989627d21b41943",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-18F2LPSHVE",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || "https://maava-7ddea-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Validate required fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId', 'messagingSenderId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field] || firebaseConfig[field] === 'undefined');

if (missingFields.length > 0) {
  console.error('Firebase configuration is missing required fields:', missingFields);
  console.error('Please set VITE_FIREBASE_* variables in frontend/.env');
}

// ─── State ─────────────────────────────────────────────────────────────────
let app;
let firebaseAuth;
let googleProvider;
let realtimeDB;

// ─── Initialize ──────────────────────────────────────────────────────────────
function ensureFirebaseInitialized() {
  try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized — project:', firebaseConfig.projectId);
    } else {
      app = existingApps[0];
    }

    if (!firebaseAuth) {
      firebaseAuth = getAuth(app);
    }

    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
    }

    // Initialize Realtime Database (used for delivery tracking — zero Maps API cost)
    if (!realtimeDB && firebaseConfig.databaseURL) {
      try {
        realtimeDB = getDatabase(app);
        console.log('Firebase Realtime Database ready — delivery tracking enabled');
      } catch (dbErr) {
        console.warn('Firebase Realtime Database not available:', dbErr.message);
      }
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize immediately on module load
ensureFirebaseInitialized();

export { firebaseAuth, googleProvider, realtimeDB, ensureFirebaseInitialized };
export const firebaseApp = app;



