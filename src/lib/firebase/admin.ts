import {
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. " +
        "Firebase Admin SDK cannot be initialized."
    );
  }

  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return app;
}

// Lazy initialization — only init when actually called at runtime
function getAdminAppLazy(): App {
  if (!adminApp) {
    adminApp = getAdminApp();
  }
  return adminApp;
}

// Use getters so initialization only happens when these are accessed at runtime
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    const target = getAuth(getAdminAppLazy()) as unknown as Record<string | symbol, unknown>;
    return target[prop];
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    const target = getFirestore(getAdminAppLazy()) as unknown as Record<string | symbol, unknown>;
    return target[prop];
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    const target = getStorage(getAdminAppLazy()) as unknown as Record<string | symbol, unknown>;
    return target[prop];
  },
});
