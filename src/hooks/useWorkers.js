import { useEffect, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { subscribeToWorkers } from '../services/workerService.js';

export function useWorkers() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setWorkers([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToWorkers(
      user.uid,
      (items) => {
        setWorkers(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  return { workers, loading, error };
}
