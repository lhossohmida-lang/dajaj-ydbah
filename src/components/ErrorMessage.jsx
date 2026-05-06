export default function ErrorMessage({ message, tone = 'error' }) {
  if (!message) {
    return null;
  }

  const tones = {
    error:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    info: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200',
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${tones[tone] || tones.error}`}>
      {message}
    </div>
  );
}
