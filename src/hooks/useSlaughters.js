import { useEffect, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { subscribeToSlaughters } from '../services/slaughterService.js';

export function useSlaughters() {
  const { user } = useAuth();
  const [slaughters, setSlaughters] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setSlaughters([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToSlaughters(
      user.uid,
      (items) => {
        setSlaughters(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  return { slaughters, loading, error };
}
