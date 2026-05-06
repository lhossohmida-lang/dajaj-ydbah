import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.js';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/slaughters/new', label: 'عملية جديدة', icon: PlusCircle },
  { to: '/records', label: 'السجلات', icon: ClipboardList },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

const pageTitles = {
  '/': 'لوحة التحكم',
  '/slaughters/new': 'إضافة عملية ذبح',
  '/records': 'سجلات العمليات',
  '/reports': 'التقارير',
  '/settings': 'الإعدادات',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageTitle = useMemo(() => {
    if (location.pathname.includes('/edit')) {
      return 'تعديل عملية ذبح';
    }

    return pageTitles[location.pathname] || 'إدارة مدبحة الدجاج';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950 dark:bg-stone-950 dark:text-stone-50 lg:flex">
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 transform border-l border-stone-200 bg-white p-4 shadow-soft transition-transform duration-200 dark:border-stone-800 dark:bg-stone-950 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-teal-700 dark:text-teal-400">نظام الإدارة</p>
            <h1 className="mt-1 text-lg font-black">{settings.slaughterhouseName || 'إدارة مدبحة الدجاج'}</h1>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="truncate text-sm font-bold">{user?.displayName || user?.email}</p>
          <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">{user?.email}</p>
          <button type="button" onClick={logout} className="app-button-secondary mt-3 w-full">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-stone-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="إغلاق القائمة"
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-100/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-stone-200 bg-white p-2 text-stone-700 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400">إدارة مدبحة الدجاج</p>
                <h2 className="text-xl font-black">{pageTitle}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              className="app-button-secondary h-10 w-10 px-0"
              aria-label={darkMode ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
              title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
