import { useEffect, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { subscribeToCustomerSlaughterServices } from '../services/customerSlaughterService.js';

export function useCustomerSlaughterServices() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setServices([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToCustomerSlaughterServices(
      user.uid,
      (items) => {
        setServices(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  return { services, loading, error };
}
