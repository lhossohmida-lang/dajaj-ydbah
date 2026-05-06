export default function LoadingScreen({ label = 'جاري التحميل...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-stone-50 text-stone-700 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 shadow-soft dark:border-stone-800 dark:bg-stone-900">
        <span className="h-3 w-3 animate-ping rounded-full bg-teal-600" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}
