const admin = require('firebase-admin');
const keyWithQuotes = '"-----BEGIN PRIVATE KEY-----\\nFAKE KEY\\n-----END PRIVATE KEY-----\\n"';

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            project_id: 'test',
            client_email: 'test@test.com',
            private_key: keyWithQuotes.replace(/\\n/g, '\n')
        })
    });
    console.log('✅ Success with quotes');
} catch (err) {
    console.log('❌ Error with quotes:', err.message);
}
