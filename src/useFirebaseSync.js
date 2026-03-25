import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { fbAuth, fbDb } from './firebase.js';
import { exportAllData, importAllData } from './db.js';

const DEBOUNCE_MS = 2000;

export function useFirebaseSync(loadAll) {
  const [currentUser, setCurrentUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'error' | 'signed-out'
  const timerRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, async (user) => {
      setCurrentUser(user);
      if (user && !initialLoadDone.current) {
        initialLoadDone.current = true;
        try {
          setSyncStatus('syncing');
          const docRef = doc(fbDb, 'users', user.uid, 'apps', 'brackroot');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            // Remove Firestore metadata before importing
            delete data._lastSaved;
            await importAllData(data);
            await loadAll();
          } else {
            // First sign-in: push local data up
            await syncNow(user);
          }
          setSyncStatus('idle');
        } catch (err) {
          console.error('Failed to load from Firestore on sign-in:', err);
          setSyncStatus('error');
        }
      } else if (!user) {
        initialLoadDone.current = false;
        setSyncStatus('signed-out');
      }
    });
    return () => unsubscribe();
  }, [loadAll]);

  // Flush pending sync when page goes to background (mobile tabs, screen lock)
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && fbAuth.currentUser && timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        exportAllData().then(data => {
          data._lastSaved = serverTimestamp();
          const docRef = doc(fbDb, 'users', fbAuth.currentUser.uid, 'apps', 'brackroot');
          setDoc(docRef, data).catch(err => console.error('Background sync failed:', err));
        });
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Write to Firestore (debounced)
  const syncToFirestore = useCallback(() => {
    if (!fbAuth.currentUser) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!fbAuth.currentUser) return;
      try {
        setSyncStatus('syncing');
        const data = await exportAllData();
        data._lastSaved = serverTimestamp();
        const docRef = doc(fbDb, 'users', fbAuth.currentUser.uid, 'apps', 'brackroot');
        await setDoc(docRef, data);
        setSyncStatus('idle');
      } catch (err) {
        console.error('Firestore save failed:', err);
        setSyncStatus('error');
      }
    }, DEBOUNCE_MS);
  }, []);

  // Immediate sync (for Sync Now button)
  const syncNow = useCallback(async (user) => {
    const uid = user?.uid || fbAuth.currentUser?.uid;
    if (!uid) return;
    try {
      setSyncStatus('syncing');
      const data = await exportAllData();
      data._lastSaved = serverTimestamp();
      const docRef = doc(fbDb, 'users', uid, 'apps', 'brackroot');
      await setDoc(docRef, data);
      setSyncStatus('idle');
    } catch (err) {
      console.error('Firestore save failed:', err);
      setSyncStatus('error');
    }
  }, []);

  // Push then pull (for Sync Now button)
  const pullFromFirestore = useCallback(async () => {
    if (!fbAuth.currentUser) return;
    try {
      setSyncStatus('syncing');
      // Push local changes first
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      const pushData = await exportAllData();
      pushData._lastSaved = serverTimestamp();
      const pushRef = doc(fbDb, 'users', fbAuth.currentUser.uid, 'apps', 'brackroot');
      await setDoc(pushRef, pushData);
      // Then pull latest
      const snap = await getDoc(pushRef);
      if (snap.exists()) {
        const data = snap.data();
        delete data._lastSaved;
        await importAllData(data);
        await loadAll();
      }
      setSyncStatus('idle');
    } catch (err) {
      console.error('Firestore sync failed:', err);
      setSyncStatus('error');
    }
  }, [loadAll]);

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fbAuth, provider);
    } catch (err) {
      console.error('Sign-in error:', err);
      alert('Sign-in failed: ' + err.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(fbAuth);
      initialLoadDone.current = false;
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  }, []);

  return {
    currentUser,
    syncStatus,
    signIn,
    signOut,
    syncToFirestore,
    syncNow,
    pullFromFirestore
  };
}
