import { ref, onValue } from 'firebase/database';
import { db, isFirebaseConfigured } from './FirebaseService';

export class TimeService {
  private static offset = 0;

  /**
   * Initializes syncing of the server time offset.
   */
  static init(): () => void {
    if (!isFirebaseConfigured() || !db) return () => {};

    const offsetRef = ref(db, '.info/serverTimeOffset');
    const unsubscribe = onValue(offsetRef, (snap) => {
      TimeService.offset = snap.val() || 0;
    });

    return unsubscribe;
  }

  /**
   * Returns the estimated server time in milliseconds.
   */
  static getServerTime(): number {
    return Date.now() + TimeService.offset;
  }
}
