import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig, firebaseEnabled } from './firebaseConfig';

export { firebaseEnabled };

export function firebaseApp(): FirebaseApp {
  if (!firebaseEnabled) throw new Error('Firebase is not configured. Set REACT_APP_FIREBASE_* in .env.local.');
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
