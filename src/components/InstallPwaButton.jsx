import { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone);
  const [message, setMessage] = useState('');

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
      setMessage('');
    }

    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setMessage('تم تثبيت التطبيق.');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (installed) {
      setMessage('التطبيق مثبت بالفعل.');
      return;
    }

    if (!deferredPrompt) {
      setMessage('من قائمة المتصفح اختر: تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.');
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMessage(choice.outcome === 'accepted' ? 'بدأ تثبيت التطبيق.' : 'تم إلغاء التثبيت.');
  }

  return (
    <div className="fixed bottom-5 left-3 z-50 flex items-center gap-2 sm:left-5">
      {message && (
        <span className="max-w-[220px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 shadow-soft dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100">
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={handleInstall}
        className="grid h-12 w-12 place-items-center rounded-full bg-teal-700 text-white shadow-soft ring-4 ring-white transition hover:bg-teal-800 focus:outline-none focus:ring-teal-200 dark:bg-teal-600 dark:ring-stone-950 dark:hover:bg-teal-500 dark:focus:ring-teal-500/30"
        aria-label="تحميل التطبيق"
        title="تحميل التطبيق"
      >
        {installed ? <Check className="h-5 w-5" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
