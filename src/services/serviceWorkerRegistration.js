export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // التثبيت يبقى اختياريًا حتى إن لم يسمح المتصفح بتسجيل الخدمة.
    });
  });
}
