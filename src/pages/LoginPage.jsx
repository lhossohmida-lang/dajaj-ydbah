import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { loginUser } from '../services/authService.js';

function translateAuthError(error) {
  const code = error?.code || '';

  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'البريد الإلكتروني أو كلمة السر غير صحيحة.';
  }

  if (code.includes('user-not-found')) {
    return 'لا يوجد حساب بهذا البريد الإلكتروني.';
  }

  if (code.includes('too-many-requests')) {
    return 'تمت محاولات كثيرة. حاول مرة أخرى لاحقًا.';
  }

  return 'تعذر تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة السر.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await loginUser(email, password);
      navigate('/');
    } catch (loginError) {
      setError(translateAuthError(loginError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="تسجيل الدخول" subtitle="ادخل إلى لوحة التحكم لإدارة عمليات المدبحة وحساب الأرباح.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorMessage message={error} />
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
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={loading} className="app-button-primary w-full">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          لا تملك حسابًا؟{' '}
          <Link to="/register" className="font-black text-teal-700 hover:text-teal-800 dark:text-teal-400">
            إنشاء حساب جديد
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
