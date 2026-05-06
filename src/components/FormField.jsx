export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="app-label">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  );
}
