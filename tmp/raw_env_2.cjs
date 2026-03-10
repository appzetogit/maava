const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../backend/.env');
const content = fs.readFileSync(envPath, 'utf8');

const match = content.match(/^FIREBASE_SERVICE_ACCOUNT_JSON=(.*)$/m);
if (match) {
    const value = match[1].trim();
    console.log('LENGTH:', value.length);
    console.log('FIRST 10:', value.slice(0, 10));
    console.log('LAST 10:', value.slice(-10));
} else {
    console.log('NOT FOUND');
}
