import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "studio-4413594533-ed619";

let firestoreInstance: Firestore | null = null;
let firestoreInitError: string | null = null;

const hasApplicationDefaultCredentials = () =>
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
  existsSync(join(homedir(), ".config", "gcloud", "application_default_credentials.json"));

const initFirestore = () => {
  if (firestoreInstance || firestoreInitError) return;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson && !hasApplicationDefaultCredentials()) {
      throw new Error("Firestore degraded: credentials missing.");
    }

    const credential = serviceAccountJson
      ? cert(JSON.parse(serviceAccountJson) as Record<string, string>)
      : applicationDefault();

    if (getApps().length === 0) {
      initializeApp({
        credential,
        projectId,
      });
    }

    firestoreInstance = getFirestore();
  } catch (error) {
    firestoreInitError =
      error instanceof Error ? error.message : "Unable to initialize Firestore";
  }
};

export const getDb = (): Firestore | null => {
  initFirestore();
  return firestoreInstance;
};

export const getFirestoreError = () => {
  initFirestore();
  return firestoreInitError;
};

export const runFirestoreQuery = async <T>(
  operation: (db: Firestore) => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> => {
  const db = getDb();
  const initError = getFirestoreError();

  if (!db) {
    return {
      ok: false,
      message: initError ?? "Firestore is not available.",
    };
  }

  try {
    const value = await operation(db);
    return { ok: true, value };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Firestore query failed.",
    };
  }
};
