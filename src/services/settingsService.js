import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const defaultSettings = {
  slaughterhouseName: 'إدارة مدبحة الدجاج',
  currency: 'دج',
  defaultYieldPercentage: 72,
  defaultNetKgSalePrice: 520,
  defaultLiveKgPurchasePrice: 360,
};

function settingsRef(userId) {
  return doc(db, 'users', userId, 'settings', 'app');
}

export async function getSettings(userId) {
  const snapshot = await getDoc(settingsRef(userId));

  if (!snapshot.exists()) {
    return defaultSettings;
  }

  return {
    ...defaultSettings,
    ...snapshot.data(),
  };
}

export function subscribeToSettings(userId, onNext, onError) {
  return onSnapshot(
    settingsRef(userId),
    (snapshot) => {
      onNext(snapshot.exists() ? { ...defaultSettings, ...snapshot.data() } : defaultSettings);
    },
    onError,
  );
}

export async function saveSettings(userId, settings) {
  const payload = {
    slaughterhouseName: settings.slaughterhouseName.trim(),
    currency: settings.currency.trim() || 'دج',
    defaultYieldPercentage: Number(settings.defaultYieldPercentage),
    defaultNetKgSalePrice: Number(settings.defaultNetKgSalePrice),
    defaultLiveKgPurchasePrice: Number(settings.defaultLiveKgPurchasePrice),
    updatedAt: serverTimestamp(),
  };

  return setDoc(settingsRef(userId), payload, { merge: true });
}
