import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, tone = 'stone', helper }) {
  const toneClasses = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    stone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
  };

  const isNegative = typeof value === 'string' && value.trim().startsWith('-');

  return (
    <article className="app-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-500 dark:text-stone-400">{title}</p>
          <p
            className={`mt-2 break-words text-2xl font-black ${
              isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-stone-950 dark:text-white'
            }`}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${toneClasses[tone] || toneClasses.stone}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
      {helper && (
        <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
          {isNegative ? <ArrowDownRight className="h-4 w-4 text-rose-500" /> : <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
          {helper}
        </p>
      )}
    </article>
  );
}
