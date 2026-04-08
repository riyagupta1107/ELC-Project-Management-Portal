// backend/src/config/firebase-admin.js
import admin from 'firebase-admin';
import { createRequire } from 'module';

// Polyfill 'require' to easily import the JSON file in ES Modules
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;