import admin from 'firebase-admin';

// Singleton initialization of Firebase Admin SDK
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Production: use service account JSON file
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else if (projectId) {
    // Dev mode: project ID only (sufficient for verifyIdToken with emulator or real project)
    admin.initializeApp({ projectId });
  } else {
    console.warn(
      '[firebaseAdmin] No GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID set. ' +
      'Auth middleware will reject all tokens. ' +
      'Set FIREBASE_PROJECT_ID in backend-local/.env for development.'
    );
    admin.initializeApp();
  }
}

export const adminAuth = admin.auth();
export default admin;
