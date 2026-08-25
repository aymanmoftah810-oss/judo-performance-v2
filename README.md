# مسار — نظام إدارة أداء لاعبي الجودو (v2.0 — Phase 2)

نظام Modular لإدارة اللاعبين، المجموعات، الاختبارات الرياضية، الحضور، وتحليل
الأداء — يعمل Offline بالكامل، جاهز لاحقًا للمزامنة السحابية وتطبيق أندرويد.

**Phase 1 + Phase 2 مكتملتين.** كل شاشات الاستخدام اليومي شغّالة: الرئيسية
(Dashboard)، اللاعبون، الاختبارات، الحضور، التقارير، الإعدادات.

## طريقة التشغيل

### للمستخدم العادي (ويندوز)
دبل كليك على **`start.bat`** — هيفتح البرنامج تلقائيًا في المتصفح على
`http://localhost:8080`. سيبقى صندوق الأوامر (الأسود) مفتوح طول فترة
الاستخدام — متقفلوش. (لازم Python مثبّت — أغلب أجهزة ويندوز عندها بالفعل،
أو حمّله من [python.org](https://www.python.org/downloads/) واختر
"Add Python to PATH" أثناء التثبيت.)

### للمطور (أي نظام تشغيل)
```bash
npm run dev
```

⚠️ **لازم تشغّل سيرفر محلي** — الملف مش هيشتغل بفتحه مباشرة بالدبل كليك
(`file://`) بسبب قيود المتصفحات على ES Modules. قرار معماري مقصود (يخدم
التحويل لـ PWA/APK لاحقًا بدون إعادة هيكلة).

## بنية المشروع

```
judo-performance-v2/
├── index.html, package.json, start.bat, capacitor.config.json
├── styles/main.css
├── scripts/sync-www.mjs        ينسخ src/styles/index.html إلى www/ (راجع قسم Capacitor تحت)
├── src/
│   ├── core/            App.js (composition root), Router, Store, EventBus,
│   │                    ErrorHandler, Navigation
│   ├── database/
│   │   ├── adapters/     StorageAdapter (عقد)، LocalStorageAdapter (التنفيذ الحالي)
│   │   ├── repositories/ BaseRepository (مشترك) + Player/Group/Test/
│   │   │                 TestResult/Standards/Attendance Repository
│   │   └── seeds/        بيانات المعايير الحقيقية (600 معيار) + دالة الربط بـ testId
│   ├── services/         Player/Group/Test/Evaluation/TestResult/
│   │                     Attendance/PerformanceAnalysis Service + errors.js
│   ├── models/           Player, Group, Test, TestResult, Standard,
│   │                     Attendance, AgeCategory
│   ├── modules/          dashboard/ players/ tests/ attendance/ reports/ settings/
│   └── utils/            normalizeDigits, toast
├── www/                  نسخة مطابقة لـ src/styles/index.html (يقرأها Capacitor)
├── android/               مشروع Capacitor/Android (لا يُعدَّل يدويًا)
├── .github/workflows/     بناء APK تلقائي عند git push
└── tests/
    ├── arch-check.mjs           فحص معماري ثابت
    ├── phase1-node-test.mjs     منطق اللاعبين (بدون متصفح)
    ├── phase2-node-test.mjs     كل أنظمة Phase 2 (بدون متصفح)
    ├── e2e-players.spec.mjs     اختبار متصفح حقيقي - اللاعبين
    └── e2e-phase2.spec.mjs      اختبار متصفح حقيقي - كل الـ Definition of Done
```

## المعمارية

```
UI (Module)  →  Service (منطق العمل + Validation)  →  Repository (شكل التخزين)  →  StorageAdapter (عقد)  →  LocalStorageAdapter
```

نفس القاعدة من Phase 1: `App.js` هو المكان الوحيد اللي يعرف فيه Adapter
مُستخدم فعليًا. كل الـ Services والـ UI Modules بتتعامل مع Interfaces/Services
محقونة (Dependency Injection)، مفيش أي منها بيلمس `localStorage` مباشرة —
اتفحص هذا آليًا (`npm run test:arch`) وهو بيغطي كل ملفات Phase 2 الجديدة
كمان، مش بس Phase 1.

### شكل التخزين (كل Entity في مفاتيح منفصلة، مش كائن واحد ضخم)
```
judo:player:1, judo:player:2, ...        judo:meta:playerNextId
judo:group:1, ...                        judo:meta:groupNextId
judo:test:1..10 (الاختبارات العشرة)      judo:meta:testNextId
judo:standard:1..600 (المعايير الحقيقية) judo:meta:standardNextId
judo:testresult:1, ...                   judo:meta:testresultNextId
judo:attendance:1, ...                   judo:meta:attendanceNextId
```

### التوافق مع بيانات Phase 1 (Migration)
لاعبين Phase 1 (بحالات عربية: مقيد/حديث/متوقف، بدون الحقول الجديدة) بيتم
ترقيتهم تلقائيًا وبدون فقد أي بيانات أول ما يُقرأوا (`PlayerRepository._normalize`):
الحالة العربية تتحول لقيمة إنجليزية ثابتة (active/new/suspended) مع الاحتفاظ
بعرضها بالعربي في الواجهة، والحقول الجديدة (playerCode, address, joinDate,
groupId) بتاخد قيم افتراضية منطقية. مفيش خطوة يدوية مطلوبة، ومفيش داتا بتتحذف.

## Capacitor / بناء APK

`capacitor.config.json` بيحدد `webDir: "www"` — يعني Capacitor بيغلّف محتوى
`www/` بس، مش `src/` مباشرة. **بعد أي تعديل في `src/` أو `styles/` أو
`index.html`، شغّل**:
```bash
npm run sync:www
```
عشان `www/` يفضل مطابق تمامًا (السكريبت ده بيتأكد من التطابق، مش نسخ يدوي
عرضة للنسيان). بعدها GitHub Actions (`.github/workflows/build-apk.yml`)
بيشغّل `npx cap sync android` تلقائيًا عند كل `push` لـ `main`، وده بيحدّث
مشروع الأندرويد الأصلي من `www/` قبل بناء الـ APK — مفيش حاجة تتعدل يدويًا
جوه `android/`.

## الاختبارات (Tests)

```bash
npm run test:arch          # فحص معماري ثابت (كل الطبقات)
node tests/phase1-node-test.mjs   # منطق اللاعبين
npm run test:phase2        # كل أنظمة Phase 2 (هجرة، مجموعات، معايير، تقييم، حضور...)
npm run test:e2e           # متصفح حقيقي - Phase 1
npm run test:e2e:phase2    # متصفح حقيقي - كل الـ Definition of Done (يحتاج سيرفر شغّال على 8080)
```
اختبارات المتصفح تحتاج `npm install -D playwright` وسيرفر محلي شغّال
(`npm run dev`) في نافذة تانية قبل التشغيل.

## حالة التنفيذ

**Phase 1 (اللاعبين) + Phase 2 (Dashboard، المجموعات، الاختبارات، المعايير،
الحضور، التقارير، تحليل الأداء) — مكتملتين ومُختبرتين بالكامل.**
راجع تقرير PHASE 2 في المحادثة للتفاصيل الدقيقة (الملفات، الاختبارات،
القرارات المعمارية، والفجوات المعروفة المتبقية).
