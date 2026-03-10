require('dotenv').config();
const pk = process.env.FIREBASE_PRIVATE_KEY;
console.log('STARTS WITH:', pk?.[0]);
console.log('ENDS WITH:', pk?.[pk?.length - 1]);
console.log('RAW PK 20-30:', pk?.substring(20, 30));
