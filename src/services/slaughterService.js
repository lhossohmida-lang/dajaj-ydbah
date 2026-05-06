import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { calculateSlaughter, normalizeSlaughterInput } from '../utils/calculations.js';

function slaughtersCollection(userId) {
  return collection(db, 'users', userId, 'slaughters');
}

function slaughterDocument(userId, slaughterId) {
  return doc(db, 'users', userId, 'slaughters', slaughterId);
}

function buildPayload(values) {
  const normalized = normalizeSlaughterInput(values);
  const calculated = calculateSlaughter(normalized);

  return {
    ...normalized,
    ...calculated,
    notes: normalized.notes?.trim() || 'لا توجد ملاحظات',
  };
}

export function subscribeToSlaughters(userId, onNext, onError) {
  const q = query(slaughtersCollection(userId), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      onNext(items);
    },
    onError,
  );
}

export async function createSlaughter(userId, values) {
  const payload = {
    ...buildPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return addDoc(slaughtersCollection(userId), payload);
}

export async function updateSlaughter(userId, slaughterId, values) {
  const payload = {
    ...buildPayload(values),
    updatedAt: serverTimestamp(),
  };

  return updateDoc(slaughterDocument(userId, slaughterId), payload);
}

export async function deleteSlaughter(userId, slaughterId) {
  return deleteDoc(slaughterDocument(userId, slaughterId));
}

export async function getSlaughter(userId, slaughterId) {
  const snapshot = await getDoc(slaughterDocument(userId, slaughterId));

  if (!snapshot.exists()) {
    throw new Error('لم يتم العثور على العملية المطلوبة.');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}
