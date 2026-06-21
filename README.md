# Golden Control — لوحة تحكم مركز الصيانة

تطبيق عربي RTL لإدارة مركز صيانة الأجهزة الكهربائية، مبني باستخدام:

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- next-themes
- TanStack Query
- Zod
- React Hook Form
- mock repositories قابلة للاستبدال لاحقًا بـ API حقيقي

---

## ما الموجود حاليًا؟

تم دمج مراحل العمل السابقة مع الـ slice الموجودة في `golden-control 2`.

### واجهات المصادقة

- `/login` صفحة تسجيل الدخول.
- `/forgot-password` شاشة استعادة كلمة المرور.
- `/reset-password` شاشة إعادة تعيين كلمة المرور.
- تسجيل دخول وهمي يحفظ الجلسة في `sessionStorage` أو `localStorage` عند تفعيل "تذكرني".

### لوحة ما بعد تسجيل الدخول

- `/dashboard` صفحة "نظرة عامة".
- Sidebar يمين.
- Topbar.
- بطاقات ملخص طلبات الصيانة.
- بطاقات الفواتير.
- بطاقة الأداء المالي.
- جدول آخر الطلبات المحدثة.

### إدارة المستخدمين

المسارات:

- `/users`
- `/users/new`
- `/users/[userId]`
- `/users/[userId]/edit`

الموجود:

- جدول مستخدمين.
- فلاتر حسب الدور والحالة.
- بطاقات KPI.
- إنشاء مستخدم.
- عرض ملف مستخدم.
- تعديل مستخدم.
- حذف مستخدم من mock repository.

### إدارة الفنيين والمخزون اليومي

المسارات:

- `/technicians/inventory`
- `/technicians/inventory/new`

الموجود:

- عرض المخزون اليومي للفنيين.
- إنشاء مخزون يومي.
- pagination.
- mock data للفنيين والمخزون.

---

## بنية الملفات المهمة

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── feedback/
│   ├── layout/
│   └── ui/
├── config/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── technicians/
│   └── users/
├── hooks/
├── lib/
├── mocks/
├── models/
├── providers/
├── repositories/
├── services/
└── styles/
```

---

## تشغيل المشروع

من داخل مجلد المشروع:

```bash
npm install
npm run dev
```

ثم افتح:

```text
http://localhost:3000
```

إذا كان المنفذ مستخدمًا، سيختار Next منفذًا آخر مثل `3001` أو `3002`.

---

## أوامر التحقق

```bash
./node_modules/.bin/tsc --noEmit --incremental false
npm run lint
npm run build
```

---

## ملاحظات تقنية

- البيانات الحالية mock داخل `src/mocks`.
- طبقة البيانات تتبع الفكرة المعمارية:
  `models → repositories → services → hooks → components`.
- يمكن استبدال mock repositories لاحقًا بـ Axios/API بدون تغيير واجهات الشاشة.
- `AppProviders` يوفّر ThemeProvider و QueryProvider على مستوى الجذر.
- تصميم الألوان والخطوط يعتمد على `src/styles/tokens.css` و `tailwind.config.ts`.

---

## الخطوات القادمة المقترحة

- ربط تسجيل الدخول بـ NextAuth أو Backend حقيقي.
- إضافة middleware لحماية مسارات dashboard.
- استبدال mock repositories بطبقة API حقيقية.
- فصل صفحة dashboard إلى مكونات أصغر إذا توسعت أكثر.
- إضافة تأكيد modal بدل `window.confirm` في حذف المستخدم.
