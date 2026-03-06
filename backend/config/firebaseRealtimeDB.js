/**
 * Firebase Realtime Database Configuration
 * ==========================================
 * Central initialization for Firebase Admin SDK + Realtime Database.
 *
 * PURPOSE:
 *  - Delivery boy online/offline status  → delivery_boys/{boyId}/status
 *  - Live location updates               → delivery_boys/{boyId}/location
 *  - Order route polylines (cache)       → active_orders/{orderId}/polyline
 *  - Delivery boy current order coords   → active_orders/{orderId}/boy_lat|boy_lng
 *
 * COST SAVING:
 *  - Polyline fetched from Google Directions API ONLY ONCE when order is assigned.
 *  - After that, every read (user app, admin) comes from Firebase — ZERO Maps API cost.
 *  - Live location is written to Firebase → all listeners read from Firebase, NOT Maps API.
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── State ────────────────────────────────────────────────────────────────────
let _db = null;
let _initialized = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Load service account JSON (prefers env vars, falls back to file on disk).
 */
function loadServiceAccount() {
    // 1. Try JSON string from env var (most flexible for cloud/docker)
    const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonStr) {
        try {
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
        }
    }

    // 2. Try individual env vars (standard approach)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        // Fix escaped newlines that come from .env files
        if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
        return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
    }

    // 2. Try the new maava service-account file
    const maavaPath = path.resolve(__dirname, 'maava-firebase-service-account.json');
    try {
        return require(maavaPath);
    } catch (_) { }

    // 3. Fall back to the old zomato key (if still present)
    const zomatoPath = path.resolve(__dirname, 'zomato-607fa-firebase-adminsdk-fbsvc-f5f782c2cc.json');
    try {
        return require(zomatoPath);
    } catch (_) { }

    return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize Firebase Admin + Realtime Database.
 * Safe to call multiple times — only runs once.
 *
 * @returns {admin.database.Database|null}
 */
export function initializeFirebaseRealtime() {
    if (_initialized) return _db;

    const serviceAccount = loadServiceAccount();
    const databaseURL = process.env.FIREBASE_DATABASE_URL ||
        (serviceAccount ? `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com` : null);

    if (!serviceAccount && !admin.apps.length) {
        console.warn('⚠️ Firebase Realtime Database: No service account credentials found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env or place maava-firebase-service-account.json in backend/config/');
        _initialized = true; // Mark as attempted to suppress repeated logs
        return null;
    }

    try {
        // Only call initializeApp if no app exists yet
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL
            });
            console.log(`✅ Firebase Admin initialized — project: ${serviceAccount.project_id}`);
        } else {
            console.log('ℹ️ Firebase Admin: reusing existing app instance for Realtime DB');
        }

        // Try to get database instance
        // This will fail if:
        // 1. Realtime Database is not enabled in Firebase Console, OR
        // 2. The existing app was initialized without databaseURL
        try {
            _db = admin.database();
            _initialized = true;
            console.log('✅ Firebase Realtime Database ready —', databaseURL);
            return _db;
        } catch (dbError) {
            // Realtime DB not available — most common reason: not enabled in Firebase Console
            // OR existing app was initialized without databaseURL
            console.warn('⚠️ Firebase Realtime Database not available:', dbError.message);
            console.warn('📋 ACTION NEEDED: Go to Firebase Console → Build → Realtime Database → Create Database');
            console.warn('📋 Then set FIREBASE_DATABASE_URL in backend/.env (e.g., https://maava-7ddea-default-rtdb.firebaseio.com)');
            _initialized = true; // Mark as attempted so we don't retry endlessly
            return null;
        }
    } catch (error) {
        if (error?.code === 'app/duplicate-app') {
            // Another module already initialized Firebase — just grab the database
            try {
                _db = admin.database();
                _initialized = true;
                console.log('✅ Firebase Realtime Database: reusing pre-initialized app');
                return _db;
            } catch (dbError) {
                console.warn('⚠️ Firebase Realtime Database: Realtime DB not enabled in Firebase Console or missing databaseURL');
                console.warn('📋 ACTION NEEDED: Enable Realtime Database in Firebase Console for project maava-7ddea');
                _initialized = true;
                return null;
            }
        }
        console.error('❌ Firebase Realtime Database initialization failed:', error.message);
        _initialized = true;
        return null;
    }
}

/**
 * Returns the initialized Realtime Database instance.
 * Returns null (with a warning) if called before initializeFirebaseRealtime().
 */
export function getRealtimeDB() {
    if (!_initialized || !_db) {
        console.warn('⚠️ Firebase Realtime Database not initialized. Call initializeFirebaseRealtime() first.');
        return null;
    }
    return _db;
}

/**
 * Quick check — is Realtime DB ready?
 */
export function isRealtimeDBReady() {
    return _initialized && !!_db;
}

export default { initializeFirebaseRealtime, getRealtimeDB, isRealtimeDBReady };
