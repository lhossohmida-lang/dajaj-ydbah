# إدارة مدبحة الدجاج

تطبيق ويب عربي RTL لإدارة عمليات ذبح الدجاج، حساب الأرباح، حفظ البيانات في Firebase، وعرض التقارير والرسوم البيانية.

## التشغيل

```bash
npm install
npm run dev
```

## تشغيل الذكاء الاصطناعي

أنشئ ملف `server/.env` من `server/.env.example` وضع مفتاح OpenRouter داخله:

```env
PORT=5000
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=ضع_مفتاح_OpenRouter_هنا
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
AI_MODEL=nousresearch/hermes-3-llama-3.1-405b
FRONTEND_URL=http://localhost:3000
ALLOWED_FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
```

ثم شغل Backend الوسيط:

```bash
cd server
npm install
npm run dev
```

أو من مجلد المشروع الرئيسي:

```bash
npm run server
```

الواجهة تتصل فقط مع:

```bash
GET /api/ai/status
POST /api/ai/chat
```

والـ Backend هو الذي يتصل مع OpenRouter. لا تضع مفتاح OpenRouter داخل `src`.

## البناء

```bash
npm run build
```
