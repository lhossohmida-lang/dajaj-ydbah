import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  calculateCustomerSlaughterService,
  getSelectedAdditionalServices,
  normalizeCustomerSlaughterInput,
} from '../utils/customerSlaughterCalculations.js';

function customerSlaughterServicesCollection(userId) {
  return collection(db, 'users', userId, 'customerSlaughterServices');
}

function buildPayload(values) {
  const normalized = normalizeCustomerSlaughterInput(values);
  const calculated = calculateCustomerSlaughterService(normalized);

  return {
    ...normalized,
    ...calculated,
    selectedAdditionalServices: getSelectedAdditionalServices(normalized.additionalServices),
    notes: normalized.notes || 'لا توجد ملاحظات',
    recordType: 'customer-slaughter-service',
    incomeType: 'service',
    affectsInventory: false,
  };
}

export function subscribeToCustomerSlaughterServices(userId, onNext, onError) {
  const q = query(customerSlaughterServicesCollection(userId), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })).sort((firstItem, secondItem) => {
        const firstDateTime = `${firstItem.date || ''} ${firstItem.time || ''}`;
        const secondDateTime = `${secondItem.date || ''} ${secondItem.time || ''}`;

        return secondDateTime.localeCompare(firstDateTime);
      });

      onNext(items);
    },
    onError,
  );
}

export async function createCustomerSlaughterService(userId, values) {
  const payload = {
    ...buildPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return addDoc(customerSlaughterServicesCollection(userId), payload);
}
