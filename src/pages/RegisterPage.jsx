import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { registerUser } from '../services/authService.js';

function translateRegisterError(error) {
  const code = error?.code || '';

  if (code.includes('email-already-in-use')) {
    return 'هذا البريد الإلكتروني مستعمل بالفعل.';
  }

  if (code.includes('weak-password')) {
    return 'كلمة السر ضعيفة. استعمل 6 أحرف على الأقل.';
  }

  if (code.includes('invalid-email')) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  return 'تعذر إنشاء الحساب. حاول مرة أخرى.';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!displayName.trim() || !email || !password || !confirmPassword) {
      setError('يرجى ملء كل الحقول.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا السر غير متطابقتين.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await registerUser(email, password, displayName);
      navigate('/');
    } catch (registerError) {
      setError(translateRegisterError(registerError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="إنشاء حساب" subtitle="أنشئ حسابًا لحفظ بيانات المدبحة بشكل منفصل وآمن.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        <label className="block">
          <span className="app-label">الاسم</span>
          <input
            type="text"
            className="app-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="اسم المستخدم"
          />
        </label>
        <label className="block">
          <span className="app-label">البريد الإلكتروني</span>
          <input
            type="email"
            className="app-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </label>
        <label className="block">
          <span className="app-label">كلمة السر</span>
          <input
            type="password"
            className="app-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6 أحرف على الأقل"
          />
        </label>
        <label className="block">
          <span className="app-label">تأكيد كلمة السر</span>
          <input
            type="password"
            className="app-input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="أعد كتابة كلمة السر"
          />
        </label>
        <button type="submit" disabled={loading} className="app-button-primary w-full">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>
        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          لديك حساب؟{' '}
          <Link to="/login" className="font-black text-teal-700 hover:text-teal-800 dark:text-teal-400">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
