import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase.js';

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  return credential;
}

export async function logoutUser() {
  return signOut(auth);
}
