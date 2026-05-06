import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { saveSettings } from '../services/settingsService.js';
import { validateSettings } from '../utils/validation.js';

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, setSettings, loading, error } = useSettings();
  const [values, setValues] = useState(settings);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(settings);
  }, [settings]);

  function updateValue(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateSettings(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      setMessageTone('error');
      setMessage('يرجى تصحيح الإعدادات قبل الحفظ.');
      return;
    }

    try {
      setSaving(true);
      await saveSettings(user.uid, values);
      setSettings(values);
      setMessageTone('success');
      setMessage('تم حفظ الإعدادات بنجاح.');
    } catch (saveError) {
      setMessageTone('error');
      setMessage(saveError.message || 'تعذر حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="جاري تحميل الإعدادات..." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">الإعدادات</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">تحفظ الإعدادات داخل users/userId/settings/app في Firestore.</p>
      </div>

      <ErrorMessage message={error || message} tone={error ? 'error' : messageTone} />

      <form onSubmit={handleSubmit} className="app-card max-w-4xl space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="اسم المدبحة" error={errors.slaughterhouseName}>
            <input
              type="text"
              className="app-input"
              value={values.slaughterhouseName}
              onChange={(event) => updateValue('slaughterhouseName', event.target.value)}
            />
          </FormField>
          <FormField label="العملة الافتراضية" error={errors.currency}>
            <input
              type="text"
              className="app-input"
              value={values.currency}
              onChange={(event) => updateValue('currency', event.target.value)}
            />
          </FormField>
          <FormField label="نسبة التصافي الافتراضية %" error={errors.defaultYieldPercentage}>
            <input
              type="number"
              min="1"
              max="100"
              step="0.01"
              className="app-input"
              value={values.defaultYieldPercentage}
              onChange={(event) => updateValue('defaultYieldPercentage', event.target.value)}
            />
          </FormField>
          <FormField label="سعر بيع افتراضي للكيلو" error={errors.defaultNetKgSalePrice}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="app-input"
              value={values.defaultNetKgSalePrice}
              onChange={(event) => updateValue('defaultNetKgSalePrice', event.target.value)}
            />
          </FormField>
          <FormField label="سعر شراء افتراضي للكيلو" error={errors.defaultLiveKgPurchasePrice}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="app-input"
              value={values.defaultLiveKgPurchasePrice}
              onChange={(event) => updateValue('defaultLiveKgPurchasePrice', event.target.value)}
            />
          </FormField>
        </div>

        <button type="submit" disabled={saving} className="app-button-primary">
          <Save className="h-4 w-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
}
