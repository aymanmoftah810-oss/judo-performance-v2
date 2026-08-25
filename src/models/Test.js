/**
 * Test — catalog entry for one physical test type.
 *
 * The 10 tests and their weights/directions are ported unchanged from the
 * previously verified Excel/web system (same real standards data, same
 * weights, same higher/lower-is-better directions) — not re-derived, to
 * avoid re-introducing transcription bugs that were already found and
 * fixed once (see PHASE2 report).
 *
 * @typedef {Object} Test
 * @property {number} id
 * @property {string} name          English name (per Phase 2 spec field list)
 * @property {string} nameAr        Arabic name (used throughout the UI)
 * @property {string} unit
 * @property {"repetitions"|"time"|"distance"|"measurement"} measurementType
 * @property {boolean} higherIsBetter
 * @property {boolean} active
 * @property {string} description
 * @property {number} weight        0..1, used by EvaluationService for Achievement%
 */

/** Seed catalog — used once by TestRepository to populate an empty store. */
export const SEED_TESTS = [
  { name: "Push-ups", nameAr: "الضغط", unit: "عدد تكرارات", measurementType: "repetitions", higherIsBetter: true, active: true, description: "عدد تكرارات الضغط خلال زمن محدد حسب الفئة العمرية", weight: 0.10 },
  { name: "Sit-ups", nameAr: "البطن", unit: "عدد تكرارات", measurementType: "repetitions", higherIsBetter: true, active: true, description: "عدد تكرارات تمرين البطن خلال 30 ثانية", weight: 0.08 },
  { name: "Plank", nameAr: "البلانك", unit: "ثانية", measurementType: "time", higherIsBetter: true, active: true, description: "أطول مدة ثبات في وضع البلانك", weight: 0.10 },
  { name: "Squats", nameAr: "الاسكوات", unit: "عدد تكرارات", measurementType: "repetitions", higherIsBetter: true, active: true, description: "عدد تكرارات الاسكوات خلال 60 ثانية", weight: 0.10 },
  { name: "Standing Jump", nameAr: "الوثب من الثبات", unit: "سم", measurementType: "distance", higherIsBetter: true, active: true, description: "أقصى مسافة وثب من الثبات", weight: 0.12 },
  { name: "Burpees", nameAr: "الرشاقة", unit: "عدد تكرارات", measurementType: "repetitions", higherIsBetter: true, active: true, description: "عدد تكرارات البيربي خلال 30 ثانية", weight: 0.12 },
  { name: "Shuttle Run 10m", nameAr: "الجري الارتدادي", unit: "ثانية", measurementType: "time", higherIsBetter: false, active: true, description: "زمن الجري الارتدادي 10م × 4", weight: 0.13 },
  { name: "Sprint", nameAr: "جري السرعة 100 متر", unit: "ثانية", measurementType: "time", higherIsBetter: false, active: true, description: "زمن جري 100 متر سريع", weight: 0.08 },
  { name: "Endurance Run", nameAr: "جري التحمل 600 متر", unit: "ثانية", measurementType: "time", higherIsBetter: false, active: true, description: "زمن جري 600 متر (يُدخل بالثواني)", weight: 0.10 },
  { name: "Flexibility", nameAr: "المرونة", unit: "سم", measurementType: "measurement", higherIsBetter: true, active: true, description: "معيار موحّد لكل الفئات العمرية والنوعين", weight: 0.07 },
];
