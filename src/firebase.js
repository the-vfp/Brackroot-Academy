import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPPRm5s5cpJff_8A5WkNbAYCp1VSZ1df4",
  authDomain: "meldoy-8ff4a.firebaseapp.com",
  projectId: "meldoy-8ff4a",
  storageBucket: "meldoy-8ff4a.firebasestorage.app",
  messagingSenderId: "342409897944",
  appId: "1:342409897944:web:3069778ffd9ca136f434ad"
};

const app = initializeApp(firebaseConfig);
export const fbAuth = getAuth(app);
export const fbDb = getFirestore(app);

enableMultiTabIndexedDbPersistence(fbDb).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence unavailable: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});
