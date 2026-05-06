import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD4u1QTMpayjaBZreiv8hZwHe3Kr8TPaNQ',
  authDomain: 'dajaj-ydbah.firebaseapp.com',
  projectId: 'dajaj-ydbah',
  storageBucket: 'dajaj-ydbah.firebasestorage.app',
  messagingSenderId: '185297941902',
  appId: '1:185297941902:web:952c13de269f4e92caa0df',
  measurementId: 'G-DH40BCZCW6',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

export { app, auth, db, analyticsPromise };
