// This file is being updated to use environment variables for Firebase configuration.
// It is no longer a static object but a function that builds the config.

export function getFirebaseConfig() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Basic validation to ensure all required variables are set.
  for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value) {
      console.error(`Firebase config error: Missing environment variable NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
  }

  return firebaseConfig;
}
