# HOS - EMS Roster

تطبيق إدارة الروستر الطبي باستخدام Node.js + Express + SQLite.

## المتطلبات

- Node.js 18+

## التثبيت والتشغيل

```bash
npm install
npm run migrate
npm start
```

الخادم يعمل افتراضياً على:

- `http://localhost:3000`

## بنية المشروع

- `server/server.js`: الخادم الرئيسي
- `database/`: تعريف وتهيئة قاعدة البيانات
- `models/`: نماذج التعامل مع البيانات
- `services/`: منطق الأعمال
- `controllers/`: معالجات API
- `middleware/`: التحقق والصلاحيات والأخطاء
- `routes/api.js`: جميع مسارات API
- `scripts/`: سكربتات الترحيل والنسخ الاحتياطي
- `uploads/photos/`: صور الأعضاء

## الحماية

- `helmet` لحماية الرؤوس
- `express-rate-limit` للحد من الطلبات
- `bcrypt` لتشفير كلمة المرور
- جلسات عبر `express-session` مع تخزين SQLite

## الصيانة

- تشغيل `npm run backup` لأخذ نسخة احتياطية
- ملفات JSON القديمة موجودة في `data/` كنسخ احتياطية/ترحيل
