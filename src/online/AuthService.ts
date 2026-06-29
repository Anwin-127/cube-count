import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './FirebaseService';

export class AuthService {
  /**
   * Automatically signs in the user anonymously on startup.
   */
  static async signIn(): Promise<User | null> {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('Firebase is not configured. Anonymous auth skipped.');
      return null;
    }

    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      console.error('Failed to sign in anonymously:', error);
      return null;
    }
  }

  /**
   * Listens to auth state changes.
   */
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!isFirebaseConfigured() || !auth) {
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
}
