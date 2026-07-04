import admin from 'firebase-admin';
import { createRequire } from 'module';

let serviceAccount;

// Check if we are running in the cloud (AWS) by looking for the private key in the environment
if (process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
} else {
  // We are running locally, use the JSON file
  const require = createRequire(import.meta.url);
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error("Firebase config error: serviceAccountKey.json missing and Environment Variables not set.");
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;