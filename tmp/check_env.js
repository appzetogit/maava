import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
console.log('LENGTH:', jsonStr?.length);
console.log('STARTS WITH:', jsonStr?.[0]);
console.log('ENDS WITH:', jsonStr?.[jsonStr?.length - 1]);

if (jsonStr) {
    try {
        JSON.parse(jsonStr);
        console.log('✅ VALID JSON');
    } catch (err) {
        console.error('❌ INVALID JSON:', err.message);
    }
} else {
    console.warn('❌ NO FIREBASE_SERVICE_ACCOUNT_JSON FOUND');
}
