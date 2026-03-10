const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../backend/.env');
const content = fs.readFileSync(envPath, 'utf8');

const lines = content.split('\n');
const jsonLine = lines.find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));

if (jsonLine) {
    const value = jsonLine.split('=')[1].trim();
    console.log('VALUE LEN:', value.length);
    console.log('FIRST CHAR:', value[0]);
    console.log('LAST CHAR:', value[value.length - 1]);

    // Check if it starts/ends with single quotes
    if (value.startsWith("'") && value.endsWith("'")) {
        console.log('⚠️ CONTAINS SINGLE QUOTES');
    }
} else {
    console.log('❌ NOT FOUND');
}
