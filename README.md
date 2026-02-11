# Iron & Metal — Mobile App

Mobile app for the **Iron & Metal** platform serving the iron & metals sector. Built with **Expo / React Native**, focused on fast, focused UX with engineering calculators and in-app support.

---

## ✨ Overview
- Bilingual experience (**Arabic / English**) with full **RTL** support.
- Smooth tab-based navigation (Home, Notifications, Account, More).
- WhatsApp OTP sign-in integrated with **Supabase**.

---

## 🚀 Key Features
- **Catalog & Sectors**
  - Browse sectors, types, and variants with smart selection.
- **Engineering Calculators**
  - Multiple calculators tied to sector data.
  - Pin your favorite calculator.
- **PDF Export**
  - Generate calculator PDFs for sharing or saving.
- **Notifications**
  - In-app notifications with unread badge and mark-all-read.
- **Support & Suggestions**
  - Built-in support form with optional image attachment.
  - Dedicated Suggestions screen.
- **Profile**
  - Manage account details and preferences.
- **Featured Sectors**
  - Quick access to favorites.
- **Deep Links**
  - Open the app from website and shared links.
- **Light/Dark Themes**
  - Custom theming with full color control.

---

## 💪 Strengths
- Clean, scalable structure (Screens / Components / Hooks / Lib).
- Mobile-first performance and UX polish.
- Tight integration with **Supabase Auth** and **Expo Notifications**.
- Shareable, professional PDF outputs.

---

## 🧱 Tech Stack
- **Expo SDK ~54**
- **React Native + TypeScript**
- **React Navigation**
- **Supabase** (Auth + user data)
- **Expo Notifications**
- **Expo Image Picker**
- **pdf-lib** for PDF generation
- **AsyncStorage** for preferences

---

## 📁 Project Structure

```
mobile/
  App.tsx
  app.json
  assets/
  components/
  contexts/
  hooks/
  lib/
  locales/
  navigation/
  screens/
```

---

## ⚙️ Run Locally

### Requirements
- Node.js
- npm
- Expo CLI (via `npx expo`)

### Install
```bash
npm install
```

### Start
```bash
npm run start
```

Run on simulators:
```bash
npm run android
npm run ios
```

---

## 🔐 Environment Variables
Create `mobile/.env` locally and never commit it:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SITE_URL=
```

> **Important:** Any variable starting with `EXPO_PUBLIC_` is embedded into the app build.

---

## 🧪 Useful Scripts
```bash
npm run start
npm run android
npm run ios
npm run web
```

---

## 🔔 Expo Notifications
Uses Expo Push Tokens and relies on `extra.eas.projectId` in `app.json`.

---

## 🛡️ Security Note
Never commit `.env` files or sensitive keys to GitHub.

---

# Iron & Metal — تطبيق الموبايل

تطبيق الموبايل لمنصة **Iron & Metal** لصناعة الحديد والمعادن. مبني على **Expo / React Native** ومصمم ليقدم تجربة استخدام سريعة ومركّزة مع أدوات حساب هندسية وميزات دعم وتواصل داخلية.

---

## ✨ نظرة عامة
- تطبيق متعدد اللغات (**العربية / الإنجليزية**) مع دعم **RTL**.
- تجربة استخدام سلسة تعتمد على تبويبات واضحة (الرئيسية، الإشعارات، الحساب، المزيد).
- تسجيل دخول عبر **WhatsApp OTP** وربط الحساب بـ **Supabase**.

---

## 🚀 أهم الميزات
- **الكتالوج والقطاعات**
  - تصفح القطاعات والأنواع والمتغيرات مع اختيار ذكي للقيم.
- **الحاسبات الهندسية**
  - حاسبات متعددة مرتبطة ببيانات القطاعات.
  - حفظ/تثبيت الحاسبة المفضلة.
- **تصدير النتائج (PDF)**
  - توليد تقرير PDF للحاسبات والمشاركة أو الحفظ.
- **الإشعارات**
  - استقبال إشعارات داخل التطبيق مع عدّاد غير مقروء وإمكانية تعليم الكل كمقروء.
- **الدعم الفني والمقترحات**
  - شاشة دعم داخلية مع إمكانية إرسال رسالة وإرفاق صورة.
  - شاشة مقترحات مستقلة.
- **الملف الشخصي**
  - إدارة الحساب ومعلومات المستخدم.
- **القطاعات المميزة**
  - الوصول السريع للقطاعات المفضلة.
- **الروابط العميقة (Deep Links)**
  - فتح التطبيق من روابط الموقع أو المخططات المشتركة.
- **وضع فاتح/داكن**
  - دعم ثيمات مخصصة وتحكم كامل بالألوان.

---

## 💪 نقاط القوة
- بنية واضحة وقابلة للتوسعة (Screens / Components / Hooks / Lib).
- تجربة مستخدم محسّنة للأجهزة المحمولة مع الاهتمام بالأداء.
- تكامل مباشر مع **Supabase Auth** و**Expo Notifications**.
- قابلية مشاركة النتائج وتوثيقها عبر **PDF**.

---

## 🧱 التقنيات المستخدمة
- **Expo SDK ~54**
- **React Native + TypeScript**
- **React Navigation**
- **Supabase** (Auth + بيانات المستخدم)
- **Expo Notifications**
- **Expo Image Picker**
- **pdf-lib** لتوليد ملفات PDF
- **AsyncStorage** لحفظ التفضيلات

---

## 📁 هيكلة المشروع

```
mobile/
  App.tsx
  app.json
  assets/
  components/
  contexts/
  hooks/
  lib/
  locales/
  navigation/
  screens/
```

---

## ⚙️ التشغيل محليًا

### المتطلبات
- Node.js
- npm
- Expo CLI (عادةً عبر `npx expo`)

### التثبيت
```bash
npm install
```

### التشغيل
```bash
npm run start
```

لتشغيل المحاكي:
```bash
npm run android
npm run ios
```

---

## 🔐 متغيرات البيئة (Environment)
أنشئ ملف `mobile/.env` محليًا فقط ولا تقم برفعه إلى GitHub:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SITE_URL=
```

> **مهم:** أي متغير يبدأ بـ `EXPO_PUBLIC_` سيُضمّن داخل التطبيق عند البناء.

---

## 🧪 أوامر مفيدة
```bash
npm run start
npm run android
npm run ios
npm run web
```

---

## 🔔 إشعارات Expo
التطبيق يستخدم Expo Push Tokens، ويعتمد على `extra.eas.projectId` الموجود داخل `app.json`.

---

## 🛡️ ملاحظة أمنية
لا ترفع ملفات `.env` أو أي بيانات حساسة إلى GitHub.

---

> © Iron & Metal — Mobile App
