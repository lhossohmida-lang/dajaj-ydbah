import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { useWorkers } from '../hooks/useWorkers.js';
import { createWorker, deleteWorker, updateWorker } from '../services/workerService.js';
import { formatCurrency } from '../utils/formatters.js';

const emptyWorkerForm = {
  name: '',
  defaultSalary: '',
  phone: '',
  notes: '',
};

function validateWorker(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'اسم العامل مطلوب.';
  }

  if (values.defaultSalary === '' || values.defaultSalary === null || values.defaultSalary === undefined) {
    errors.defaultSalary = 'الأجر الافتراضي مطلوب.';
  } else if (!Number.isFinite(Number(values.defaultSalary))) {
    errors.defaultSalary = 'الأجر الافتراضي يجب أن يكون رقمًا.';
  } else if (Number(values.defaultSalary) < 0) {
    errors.defaultSalary = 'الأجر الافتراضي لا يمكن أن يكون سالبًا.';
  }

  return errors;
}

export default function WorkersPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { workers, loading, error } = useWorkers();
  const [values, setValues] = useState(emptyWorkerForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const [saving, setSaving] = useState(false);

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

  function resetForm() {
    setValues(emptyWorkerForm);
    setErrors({});
    setEditingId('');
  }

  function startEdit(worker) {
    setEditingId(worker.id);
    setValues({
      name: worker.name || '',
      defaultSalary: worker.defaultSalary ?? '',
      phone: worker.phone || '',
      notes: worker.notes || '',
    });
    setErrors({});
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateWorker(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      setMessageTone('error');
      setMessage('يرجى تصحيح بيانات العامل قبل الحفظ.');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateWorker(user.uid, editingId, values);
        setMessage('تم تحديث العامل بنجاح.');
      } else {
        await createWorker(user.uid, values);
        setMessage('تم إضافة العامل بنجاح.');
      }
      setMessageTone('success');
      resetForm();
    } catch (saveError) {
      setMessageTone('error');
      setMessage(saveError.message || 'تعذر حفظ العامل.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(worker) {
    const confirmed = window.confirm(`هل تريد حذف العامل "${worker.name}" من السجل؟`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteWorker(user.uid, worker.id);
      setMessageTone('success');
      setMessage('تم حذف العامل من السجل.');
      if (editingId === worker.id) {
        resetForm();
      }
    } catch (deleteError) {
      setMessageTone('error');
      setMessage(deleteError.message || 'تعذر حذف العامل.');
    }
  }

  if (loading) {
    return <LoadingScreen label="جاري تحميل سجل العمال..." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">العمال</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">سجل العمال الدائمين لاختيارهم لاحقًا داخل مصاريف عملية الذبح.</p>
      </div>

      <ErrorMessage message={error || message} tone={error ? 'error' : messageTone} />

      <section className="app-card p-5">
        <h4 className="text-lg font-black">{editingId ? 'تعديل عامل' : 'إضافة عامل'}</h4>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px_180px_1fr_auto]">
          <FormField label="اسم العامل" error={errors.name}>
            <input
              type="text"
              className="app-input"
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
              placeholder="اسم العامل"
            />
          </FormField>
          <FormField label="الأجر الافتراضي" error={errors.defaultSalary}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="app-input"
              value={values.defaultSalary}
              onChange={(event) => updateValue('defaultSalary', event.target.value)}
              placeholder="0"
            />
          </FormField>
          <FormField label="الهاتف">
            <input
              type="text"
              className="app-input"
              value={values.phone}
              onChange={(event) => updateValue('phone', event.target.value)}
              placeholder="اختياري"
            />
          </FormField>
          <FormField label="ملاحظات">
            <input
              type="text"
              className="app-input"
              value={values.notes}
              onChange={(event) => updateValue('notes', event.target.value)}
              placeholder="اختياري"
            />
          </FormField>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={saving} className="app-button-primary h-11">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? 'حفظ...' : editingId ? 'تحديث' : 'إضافة'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="app-button-secondary h-11 w-11 px-0" title="إلغاء">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-right text-sm dark:divide-stone-800">
            <thead className="bg-stone-50 text-xs font-black text-stone-500 dark:bg-stone-900 dark:text-stone-400">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">اسم العامل</th>
                <th className="whitespace-nowrap px-4 py-3">الأجر الافتراضي</th>
                <th className="whitespace-nowrap px-4 py-3">الهاتف</th>
                <th className="whitespace-nowrap px-4 py-3">ملاحظات</th>
                <th className="whitespace-nowrap px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/70">
                  <td className="whitespace-nowrap px-4 py-3 font-black">{worker.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatCurrency(worker.defaultSalary, settings.currency)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{worker.phone || 'غير مسجل'}</td>
                  <td className="min-w-48 px-4 py-3">{worker.notes || 'لا توجد ملاحظات'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEdit(worker)} className="app-button-secondary h-9 w-9 px-0" title="تعديل">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(worker)} className="app-button-danger h-9 w-9 px-0" title="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!workers.length && (
          <div className="px-4 py-10 text-center text-sm font-semibold text-stone-500 dark:text-stone-400">
            لا يوجد عمال مسجلون بعد.
          </div>
        )}
      </section>
    </div>
  );
}
