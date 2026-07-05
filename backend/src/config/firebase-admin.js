import { initializeApp, cert, getApps } from "firebase-admin/app";
import { createRequire } from "module";

let serviceAccount;

if (process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  const require = createRequire(import.meta.url);
  try {
    serviceAccount = require("./serviceAccountKey.json");
  } catch (error) {
    console.error(
      "Firebase config error: serviceAccountKey.json missing and environment variables not set."
    );
    throw error;
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}