import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App | null = null;

export function getFirebaseAdmin(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0]!;
    return app;
  }

  // 1. Try local or Render secret file locations
  const candidateKeyPaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    '/etc/secrets/serviceAccountKey.json',
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'sikapos-27544-firebase-adminsdk-fbsvc-a39353bf94.json'),
  ].filter(Boolean) as string[];

  for (const candidatePath of candidateKeyPaths) {
    if (fs.existsSync(candidatePath)) {
      try {
        const fileData = fs.readFileSync(candidatePath, 'utf8');
        const serviceAccount = JSON.parse(fileData);
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || 'sikapos-27544',
        });
        return app;
      } catch (e) {
        console.warn(`[FirebaseAdmin] Failed to load key from ${candidatePath}:`, e);
      }
    }
  }

  // 2. Try FIREBASE_SERVICE_ACCOUNT env var (JSON string or file path)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      let parsed: any;
      if (serviceAccountJson.trim().startsWith('{')) {
        parsed = JSON.parse(serviceAccountJson);
      } else if (fs.existsSync(serviceAccountJson)) {
        parsed = JSON.parse(fs.readFileSync(serviceAccountJson, 'utf8'));
      }

      if (parsed) {
        app = initializeApp({
          credential: cert(parsed),
          projectId: parsed.project_id || 'sikapos-27544',
        });
        return app;
      }
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  }

  // 3. Try individual env vars (useful on Render/Railway)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'sikapos-27544';

  if (privateKey && clientEmail) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return app;
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to initialize with individual env vars:', e);
    }
  }

  // 4. Fallback to default credentials
  app = initializeApp({
    projectId,
  });

  return app;
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseAdmin());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseAdmin());
}
