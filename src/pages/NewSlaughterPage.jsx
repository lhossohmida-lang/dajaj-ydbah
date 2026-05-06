import SlaughterForm from '../components/SlaughterForm.jsx';
import { createSlaughter } from '../services/slaughterService.js';

export default function NewSlaughterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">إضافة عملية ذبح جديدة</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">أدخل البيانات، احسب النتائج، ثم احفظ العملية في Firestore.</p>
      </div>
      <SlaughterForm mode="create" onSubmit={createSlaughter} />
    </div>
  );
}
