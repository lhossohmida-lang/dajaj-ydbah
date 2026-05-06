import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import SlaughterForm from '../components/SlaughterForm.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getSlaughter, updateSlaughter } from '../services/slaughterService.js';

export default function EditSlaughterPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [slaughter, setSlaughter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadSlaughter() {
      try {
        setLoading(true);
        const data = await getSlaughter(user.uid, id);

        if (alive) {
          setSlaughter(data);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError.message);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadSlaughter();

    return () => {
      alive = false;
    };
  }, [id, user.uid]);

  if (loading) {
    return <LoadingScreen label="جاري تحميل العملية..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">تعديل عملية ذبح</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">سيعاد حساب النتائج تلقائيًا عند حفظ التعديل.</p>
      </div>
      <SlaughterForm mode="edit" initialValues={slaughter} onSubmit={(userId, values) => updateSlaughter(userId, id, values)} />
    </div>
  );
}
