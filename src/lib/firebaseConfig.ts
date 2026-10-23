/**
 * Firebase web config comes from .env.local (REACT_APP_FIREBASE_*). These values are not secrets:
 * Firestore security rules (firestore.rules) decide who can read and write.
 * Kept apart from firebase.ts so checking `firebaseEnabled` doesn't pull the SDK into the main bundle.
 */
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

/** False until the env vars are set; the site then shows the bundled starter catalog. */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
