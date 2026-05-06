# إدارة مدبحة الدجاج

تطبيق ويب عربي RTL لإدارة عمليات ذبح الدجاج، حساب الأرباح، حفظ البيانات في Firebase، وعرض التقارير والرسوم البيانية.

## التشغيل

```bash
npm install
npm run dev
```

## تشغيل الذكاء الاصطناعي المحلي

شغل Ollama وثبت النموذج:

```bash
ollama serve
ollama pull gemma4:e2b
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
http://localhost:5000/api/ai/chat
```

والـ Backend هو الذي يتصل محليًا مع Ollama.

## البناء

```bash
npm run build
```
