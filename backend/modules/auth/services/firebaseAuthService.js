import admin from 'firebase-admin';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class FirebaseAuthService {
  constructor() {
    this.initialized = false;
    // Initialize asynchronously (don't await in constructor)
    this.init().catch(err => {
      logger.error(`Error initializing Firebase Auth service: ${err.message}`);
    });
  }

  async init() {
    if (this.initialized) return;

    try {
      // If Firebase Admin is already initialized (by firebaseRealtimeDB.js), just mark as ready
      if (admin.apps.length > 0) {
        this.initialized = true;
        logger.info('Firebase Auth service: reusing existing Firebase Admin app');
        return;
      }

      // Try to load credentials (env vars first, then service account files)
      let projectId = process.env.FIREBASE_PROJECT_ID;
      let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Fix escaped newlines
      if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Fallback: read from service account JSON files
      if (!projectId || !clientEmail || !privateKey) {
        try {
          const maavaPath = path.resolve(__dirname, '../../../config/maava-firebase-service-account.json');
          const zomatoPath = path.resolve(__dirname, '../../../config/zomato-607fa-firebase-adminsdk-fbsvc-f5f782c2cc.json');

          let serviceAccountPath = null;
          if (fs.existsSync(maavaPath)) {
            serviceAccountPath = maavaPath;
          } else if (fs.existsSync(zomatoPath)) {
            serviceAccountPath = zomatoPath;
          }

          if (serviceAccountPath) {
            const json = require(serviceAccountPath);
            projectId = projectId || json.project_id;
            clientEmail = clientEmail || json.client_email;
            privateKey = privateKey || json.private_key;
          }
        } catch (err) {
          logger.warn(`Failed to read Firebase service account file: ${err.message}`);
        }
      }

      if (!projectId || !clientEmail || !privateKey) {
        logger.warn(
          'Firebase Admin not fully configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env or place maava-firebase-service-account.json in backend/config/'
        );
        return;
      }

      try {
        const databaseURL = process.env.FIREBASE_DATABASE_URL ||
          `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;

        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
          databaseURL
        });

        this.initialized = true;
        logger.info(`Firebase Admin initialized for auth verification (DB: ${databaseURL})`);
      } catch (error) {
        // If already initialized, ignore the "app exists" error
        if (error?.code === 'app/duplicate-app') {
          this.initialized = true;
          logger.warn('Firebase Admin already initialized, reusing existing instance');
          return;
        }

        logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
      }
    } catch (error) {
      logger.error(`Error in Firebase Auth init: ${error.message}`);
    }
  }

  isEnabled() {
    // Also check if apps are available (in case initialized by firebaseRealtimeDB.js)
    if (!this.initialized && admin.apps.length > 0) {
      this.initialized = true;
    }
    return this.initialized;
  }

  /**
   * Verify a Firebase ID token and return decoded claims
   * @param {string} idToken
   * @returns {Promise<admin.auth.DecodedIdToken>}
   */
  async verifyIdToken(idToken) {
    if (!this.isEnabled()) {
      throw new Error('Firebase Admin is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env');
    }

    if (!idToken) {
      throw new Error('ID token is required');
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      logger.info('Firebase ID token verified', { uid: decoded.uid, email: decoded.email });
      return decoded;
    } catch (error) {
      logger.error(`Error verifying Firebase ID token: ${error.message}`);
      throw new Error('Invalid or expired Firebase ID token');
    }
  }
}

export default new FirebaseAuthService();


