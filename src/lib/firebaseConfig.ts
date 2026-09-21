const rawFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim(),
};

const environmentVariableByConfigKey = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
} as const;

const missingFirebaseVariables = Object.entries(rawFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => environmentVariableByConfigKey[key as keyof typeof environmentVariableByConfigKey]);

if (missingFirebaseVariables.length > 0) {
  throw new Error(
    `Kapehan cannot connect because Firebase configuration is missing: ${missingFirebaseVariables.join(', ')}. ` +
    'For a web deployment, verify the repository secrets used during the build.'
  );
}

export const firebaseConfig = rawFirebaseConfig as { [Key in keyof typeof rawFirebaseConfig]: string };
