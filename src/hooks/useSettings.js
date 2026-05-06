import { useEffect, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { defaultSettings, subscribeToSettings } from '../services/settingsService.js';

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setSettings(defaultSettings);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToSettings(
      user.uid,
      (savedSettings) => {
        setSettings(savedSettings);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  return { settings, setSettings, loading, error };
}
