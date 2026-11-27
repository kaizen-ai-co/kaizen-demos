'use client';

import { getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth';

/**
 * Lado navegador de Firebase: solo sirve para el botón "Entrar con Google".
 * El idToken resultante se cambia en el servidor por una cookie de sesión
 * (POST /api/sesion). El navegador nunca lee ni escribe Firestore directamente.
 */
function appCliente() {
  return (
    getApps()[0] ??
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
  );
}

export async function entrarConGoogle(): Promise<string> {
  const auth = getAuth(appCliente());
  const proveedor = new GoogleAuthProvider();
  proveedor.setCustomParameters({ prompt: 'select_account' });
  const r = await signInWithPopup(auth, proveedor);
  return r.user.getIdToken(true);
}

export async function salirDeGoogle() {
  await signOut(getAuth(appCliente()));
}
