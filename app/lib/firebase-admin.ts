import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const isNewApp = getApps().length === 0;

const adminApp = isNewApp
  ? initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  : getApp();

export const adminDb = getFirestore(adminApp);

if (isNewApp) {
  // Los items del inventario tienen campos opcionales (fechaLimite, notas,
  // coleccion) que pueden llegar como `undefined`; sin esto, Firestore
  // rechaza el documento entero.
  adminDb.settings({ ignoreUndefinedProperties: true });
}
