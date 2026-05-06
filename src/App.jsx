import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import { useAuth } from './hooks/useAuth.jsx';

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const EditSlaughterPage = lazy(() => import('./pages/EditSlaughterPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const NewSlaughterPage = lazy(() => import('./pages/NewSlaughterPage.jsx'));
const RecordsPage = lazy(() => import('./pages/RecordsPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const WorkersPage = lazy(() => import('./pages/WorkersPage.jsx'));

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="جاري التحقق من تسجيل الدخول..." />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="جاري تحميل التطبيق..." />;
  }

  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen label="جاري تحميل الصفحة..." />}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="slaughters/new" element={<NewSlaughterPage />} />
            <Route path="slaughters/:id/edit" element={<EditSlaughterPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
