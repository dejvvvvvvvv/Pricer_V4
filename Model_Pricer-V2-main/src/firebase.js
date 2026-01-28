import { getApps, initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

const env = import.meta.env;

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = required.filter((k) => !env[k]);
if (missing.length) {
  throw new Error(
    `[Firebase] Missing env vars: ${missing.join(", ")}. ` +
      `Create .env.local in project root (next to package.json) and set VITE_FIREBASE_* for model-pricer.`
  );
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  ...(env.VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID } : {}),
};

console.log("Firebase projectId:", firebaseConfig.projectId);
console.log("Firebase authDomain:", firebaseConfig.authDomain);

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

export const db = getFirestore(app);
export const storage = getStorage(app);

export const analyticsPromise =
  typeof window !== "undefined"
    ? analyticsSupported()
        .then((ok) => (ok ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);
