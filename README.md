# مسار — نظام إدارة أداء لاعبي الجودو (v2.0 — Phase 1)

نظام Modular لإدارة اللاعبين وتقييم أدائهم البدني، مصمم ليعمل Offline بالكامل
ويكون جاهزًا مستقبلًا للمزامنة السحابية وتطبيق أندرويد (APK).

**هذه نسخة Phase 1 فقط**: وحدة اللاعبين (Players) شغّالة بالكامل بالمعمارية
الجديدة. باقي الوحدات (الاختبارات، الحضور، بطاقة اللاعب، لوحة التحكم...)
هتُبنى في المراحل التالية حسب الخطة المتفق عليها.

## طريقة التشغيل

### للمستخدم العادي (ويندوز)
دبل كليك على **`start.bat`** — هيفتح البرنامج تلقائيًا في المتصفح على
`http://localhost:8080`. سيبقى صندوق الأوامر (الأسود) مفتوح طول فترة
الاستخدام — متقفلوش.

**ملاحظة**: لازم يكون عندك Python مثبّت على جهازك (أغلب أجهزة ويندوز
الحديثة عندها بالفعل، أو حمّله من [python.org](https://www.python.org/downloads/)
واختر "Add Python to PATH" أثناء التثبيت).

### للمطور (أي نظام تشغيل)
```bash
npm run dev
```
أو أي سيرفر ملفات ثابتة تانِ (`npx serve`, `php -S localhost:8080`, إلخ) —
المهم إنه يشتغل من **جذر مجلد المشروع** (نفس المجلد اللي فيه `index.html`).

⚠️ **لازم تشغّل سيرفر محلي** — الملف مش هيشتغل بفتحه مباشرة بالدبل كليك
(`file://`) بسبب قيود المتصفحات الأمنية على ES Modules. هذا قرار معماري
مقصود (راجع قسم "لماذا ES Modules" تحت).

## بنية المشروع

```
judo-performance-v2/
├── index.html              نقطة الدخول
├── start.bat                تشغيل سريع على ويندوز
├── package.json
├── styles/main.css
├── src/
│   ├── core/
│   │   ├── App.js            composition root - الوحيد اللي يعرف أي Adapter مستخدم فعليًا
│   │   ├── Router.js          توجيه بسيط بين الوحدات (Hash-based)
│   │   ├── Store.js           (محجوز - غير مستخدم في Phase 1)
│   │   ├── EventBus.js        pub/sub بين الوحدات
│   │   └── ErrorHandler.js    يظهر أي خطأ JS كرسالة مرئية بدل فشل صامت
│   ├── database/
│   │   ├── adapters/
│   │   │   ├── StorageAdapter.js       العقد (interface) المشترك
│   │   │   └── LocalStorageAdapter.js  التنفيذ الحالي (Phase 1)
│   │   └── repositories/
│   │       └── PlayerRepository.js     يعرف "شكل" تخزين اللاعبين، ولا يعرف أي Adapter
│   ├── services/
│   │   └── PlayerService.js   منطق العمل والتحقق (Validation) - لا يعرف التخزين إطلاقًا
│   ├── models/
│   │   └── Player.js          شكل بيانات اللاعب
│   ├── modules/
│   │   └── players/
│   │       └── PlayersModule.js   واجهة الاستخدام (UI) - تعرف Service بس
│   └── utils/
│       ├── normalizeDigits.js  تطبيع الأرقام العربية (درس من نسخة سابقة - راجع الملف)
│       └── toast.js
└── tests/
    ├── arch-check.mjs          فحص ثابت: لا اعتماد مباشر على localStorage خارج الـ Adapter
    └── e2e-players.spec.mjs    اختبار فعلي بمتصفح حقيقي (Playwright)
```

## المعمارية (لماذا الشكل ده)

```
Player UI (PlayersModule)
      ↓  (يستخدم فقط)
PlayerService                 ← منطق العمل + التحقق من صحة البيانات
      ↓  (يستخدم فقط)
PlayerRepository               ← يعرف "شكل" التخزين (المفاتيح)، لا يعرف الـ Adapter المحدد
      ↓  (يستخدم فقط عبر الواجهة)
StorageAdapter (interface)
      ↓
LocalStorageAdapter  (Phase 1)  ← الوحيد المسموح له يلمس localStorage مباشرة
IndexedDBAdapter     (Phase 2)  ← نفس الواجهة بالضبط، هتحل محل اللي فوق
```

**القاعدة الذهبية**: `PlayerService` و `PlayersModule` **لا يعرفان إطلاقًا**
هل التخزين حاليًا localStorage أم IndexedDB. في Phase 2 هيتغير سطر واحد بس
في `App.js` (استبدال `LocalStorageAdapter` بـ `IndexedDBAdapter`)، وكل حاجة
تانية في المشروع تفضل زي ما هي.

### شكل التخزين
كل لاعب بيتخزن في مفتاح منفصل (مش كائن STATE واحد ضخم زي النسخة القديمة):
```
judo:player:1  →  { id:1, name:"...", ... }
judo:player:2  →  { id:2, name:"...", ... }
judo:meta:playerNextId  →  3
```
هذا يخلي الانتقال لـ IndexedDB طبيعي جدًا (كل مفتاح = سجل واحد).

### لماذا ES Modules وسيرفر محلي (مش دبل كليك)؟
اخترنا `import`/`export` حقيقية بدل تجميع كل حاجة في ملف واحد، عشان:
1. فصل معماري نظيف وقابل للاختبار (كل طبقة ملف مستقل).
2. البنية دي هي نفسها اللي هتتحول لـ PWA ثم APK (عبر Capacitor) لاحقًا —
   وكلاهما أصلًا بيشتغلوا عبر سيرفر محلي/مصدر آمن، مش `file://`.
القرار ده يوفر علينا إعادة هيكلة المشروع تاني وقت التحويل لـ APK.

## الاختبارات (Tests)

### فحص معماري (ثابت، بدون متصفح)
```bash
node tests/arch-check.mjs
```
يتأكد إن `PlayerService.js` و `PlayersModule.js` و `PlayerRepository.js`
لا يحتوون على أي إشارة مباشرة لـ `localStorage` — فقط `LocalStorageAdapter.js`
مسموح له بكده.

### اختبار فعلي بمتصفح حقيقي (يتطلب Playwright)
```bash
npm install -D playwright
node tests/e2e-players.spec.mjs
```
يفتح التطبيق فعليًا، يضيف لاعب، يعدّله، يحذفه، ويتأكد إن البيانات بتفضل
موجودة بعد إعادة تحميل الصفحة.

## حالة التنفيذ الحالية

**Phase 1 — Players Module: مكتملة ومُختبرة (راجع تقرير PHASE 1 في المحادثة).**

المراحل القادمة (بانتظار التوجيه): قاعدة بيانات IndexedDB، فصل محرك التقييم،
إخراج المعايير من الكود، شاشة إدارة المعايير، نظام الاختبارات الجماعي،
الحضور، بطاقة اللاعب، لوحة التحكم، النسخ الاحتياطي، تجهيز المزامنة
والتوثيق، ثم APK.
