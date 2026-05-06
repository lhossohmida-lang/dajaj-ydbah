import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { toNumber } from '../utils/calculations.js';

function workersCollection(userId) {
  return collection(db, 'users', userId, 'workers');
}

function workerDocument(userId, workerId) {
  return doc(db, 'users', userId, 'workers', workerId);
}

function buildWorkerPayload(values) {
  return {
    name: values.name.trim(),
    defaultSalary: toNumber(values.defaultSalary),
    phone: values.phone?.trim() || '',
    notes: values.notes?.trim() || '',
    active: values.active ?? true,
  };
}

export function subscribeToWorkers(userId, onNext, onError) {
  const q = query(workersCollection(userId), orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      onNext(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })),
      );
    },
    onError,
  );
}

export async function createWorker(userId, values) {
  return addDoc(workersCollection(userId), {
    ...buildWorkerPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateWorker(userId, workerId, values) {
  return updateDoc(workerDocument(userId, workerId), {
    ...buildWorkerPayload(values),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorker(userId, workerId) {
  return deleteDoc(workerDocument(userId, workerId));
}
