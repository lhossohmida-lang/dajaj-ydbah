import { Wheat } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="order-2 rounded-lg border border-teal-900/10 bg-teal-800 p-8 text-white shadow-soft lg:order-1">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white/15">
            <Wheat className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="max-w-xl text-3xl font-black leading-tight sm:text-4xl">إدارة مدبحة الدجاج</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-teal-50">
            نظام عملي لحفظ عمليات الذبح، حساب المصاريف والأرباح، ومتابعة التقارير اليومية والشهرية من أي جهاز.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-teal-50 sm:grid-cols-3">
            <div className="rounded-lg bg-white/10 p-4">حسابات فورية</div>
            <div className="rounded-lg bg-white/10 p-4">بيانات منفصلة لكل مستخدم</div>
            <div className="rounded-lg bg-white/10 p-4">تقارير ورسوم بيانية</div>
          </div>
        </section>
        <section className="order-1 app-card mx-auto w-full max-w-md p-6 lg:order-2">
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{subtitle}</p>
          {children}
        </section>
      </div>
    </main>
  );
}
